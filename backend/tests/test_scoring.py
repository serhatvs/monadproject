"""
test_scoring.py — Unit tests for the scoring engine and signal extractors.
Owner: Team Member A (Backend/Scoring)
"""

import pytest
from app.scoring.engine import compute_score
from app.scoring.signals import (
    signal_wallet_age,
    signal_tx_count,
    signal_approval_patterns,
    signal_burst_activity,
    signal_counterparty_diversity,
    signal_balance,
)
import time

SAMPLE_ADDRESS = "0xabcdef1234567890abcdef1234567890abcdef12"


def make_wallet_data(**overrides):
    base = {
        "address": SAMPLE_ADDRESS,
        "balance_eth": 1.0,
        "tx_count": 50,
        "first_tx_timestamp": time.time() - 86400 * 200,  # 200 days ago
        "last_tx_timestamp": time.time() - 3600,
        "unique_counterparties": 20,
        "approval_count": 3,
        "contract_interactions": 15,
        "erc20_transfer_count": 15,
        "burst_detected": False,
        "large_inflow_detected": False,
        "large_outflow_detected": False,
        "is_contract": False,
        "recent_tx_timestamps": [],
    }
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# Score range tests
# ---------------------------------------------------------------------------

def test_score_in_valid_range():
    data = make_wallet_data()
    result = compute_score(SAMPLE_ADDRESS, data)
    assert 0 <= result.score <= 100


def test_new_wallet_scores_lower():
    new = make_wallet_data(
        tx_count=1,
        first_tx_timestamp=time.time() - 3600,  # 1 hour old
        unique_counterparties=1,
        approval_count=0,
    )
    established = make_wallet_data(
        tx_count=100,
        first_tx_timestamp=time.time() - 86400 * 365,  # 1 year old
        unique_counterparties=40,
    )
    new_result = compute_score(SAMPLE_ADDRESS, new)
    est_result = compute_score(SAMPLE_ADDRESS, established)
    assert new_result.score < est_result.score


def test_burst_lowers_score():
    normal = make_wallet_data(burst_detected=False)
    burst = make_wallet_data(burst_detected=True)
    assert compute_score(SAMPLE_ADDRESS, burst).score < compute_score(SAMPLE_ADDRESS, normal).score


def test_high_approvals_lowers_score():
    low_approvals = make_wallet_data(approval_count=2)
    high_approvals = make_wallet_data(approval_count=50)
    assert (
        compute_score(SAMPLE_ADDRESS, high_approvals).score
        < compute_score(SAMPLE_ADDRESS, low_approvals).score
    )


# ---------------------------------------------------------------------------
# Risk level tests
# ---------------------------------------------------------------------------

def test_risk_level_low():
    data = make_wallet_data(
        tx_count=200,
        first_tx_timestamp=time.time() - 86400 * 400,
        unique_counterparties=80,
        approval_count=2,
    )
    result = compute_score(SAMPLE_ADDRESS, data)
    assert result.risk_level.value in ("low", "medium")  # established wallet


def test_risk_level_high_for_very_new_wallet():
    data = make_wallet_data(
        tx_count=0,
        first_tx_timestamp=None,
        unique_counterparties=0,
        approval_count=0,
        balance_eth=0.0,
        burst_detected=True,
        large_inflow_detected=True,
        large_outflow_detected=True,
    )
    result = compute_score(SAMPLE_ADDRESS, data)
    assert result.risk_level.value == "high"


# ---------------------------------------------------------------------------
# Signal unit tests
# ---------------------------------------------------------------------------

def test_wallet_age_signal_new():
    data = make_wallet_data(first_tx_timestamp=time.time() - 3600, tx_count=1)
    sig = signal_wallet_age(data)
    assert sig.score_impact < 0


def test_wallet_age_signal_old():
    data = make_wallet_data(first_tx_timestamp=time.time() - 86400 * 500)
    sig = signal_wallet_age(data)
    assert sig.score_impact > 0


def test_tx_count_zero():
    data = make_wallet_data(tx_count=0)
    sig = signal_tx_count(data)
    assert sig.score_impact < 0


def test_tx_count_moderate():
    data = make_wallet_data(tx_count=50)
    sig = signal_tx_count(data)
    assert sig.score_impact > 0


def test_high_approval_ratio_penalized():
    data = make_wallet_data(approval_count=10, tx_count=10)
    sig = signal_approval_patterns(data)
    assert sig.score_impact < 0


def test_burst_detected_penalized():
    data = make_wallet_data(burst_detected=True)
    sig = signal_burst_activity(data)
    assert sig.score_impact < 0


def test_no_burst_positive():
    data = make_wallet_data(burst_detected=False)
    sig = signal_burst_activity(data)
    assert sig.score_impact > 0


# ---------------------------------------------------------------------------
# Response structure tests
# ---------------------------------------------------------------------------

def test_response_has_required_fields():
    data = make_wallet_data()
    result = compute_score(SAMPLE_ADDRESS, data)
    assert result.address == SAMPLE_ADDRESS
    assert isinstance(result.positives, list)
    assert isinstance(result.warnings, list)
    assert isinstance(result.signals, list)
    assert isinstance(result.explanation, str)
    assert 0.0 <= result.confidence <= 1.0


def test_positives_and_warnings_non_overlapping():
    data = make_wallet_data()
    result = compute_score(SAMPLE_ADDRESS, data)
    pos_set = set(result.positives)
    warn_set = set(result.warnings)
    assert pos_set.isdisjoint(warn_set)
