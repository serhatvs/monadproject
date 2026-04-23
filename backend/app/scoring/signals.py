"""
signals.py — Individual signal extractors and their score contributions.
Owner: Team Member A (Backend/Scoring)

Each signal function takes wallet_data and returns a SignalDetail.
Score impacts:
  > 0 → positive (trust signal, adds to score)
  < 0 → negative (risk signal, subtracts from score)
  = 0 → neutral / not enough data
"""

from __future__ import annotations

import time
from typing import Any, Dict

from app.models import SignalDetail

WalletData = Dict[str, Any]


# ---------------------------------------------------------------------------
# Wallet Age
# ---------------------------------------------------------------------------

def signal_wallet_age(data: WalletData) -> SignalDetail:
    """
    Older wallets are generally more trustworthy.
    Penalize very new wallets; reward established ones.
    """
    first_ts = data.get("first_tx_timestamp")
    if first_ts is None or data.get("tx_count", 0) == 0:
        return SignalDetail(
            name="wallet_age",
            value=None,
            score_impact=-5.0,
            label="No transaction history found — wallet appears brand new or inactive.",
        )

    age_days = (time.time() - first_ts) / 86400

    if age_days < 7:
        impact = -15.0
        label = f"Wallet is only {age_days:.0f} day(s) old — very new, elevated risk."
    elif age_days < 30:
        impact = -8.0
        label = f"Wallet is {age_days:.0f} days old — relatively new."
    elif age_days < 90:
        impact = 2.0
        label = f"Wallet is {age_days:.0f} days old — moderate age."
    elif age_days < 365:
        impact = 8.0
        label = f"Wallet is {age_days:.0f} days old — established history."
    else:
        impact = 12.0
        label = f"Wallet is over {age_days / 365:.1f} year(s) old — strong history."

    return SignalDetail(name="wallet_age", value=round(age_days), score_impact=impact, label=label)


# ---------------------------------------------------------------------------
# Transaction Count
# ---------------------------------------------------------------------------

def signal_tx_count(data: WalletData) -> SignalDetail:
    tx_count = data.get("tx_count", 0)

    if tx_count == 0:
        impact = -10.0
        label = "No transactions — wallet never used or very new."
    elif tx_count < 5:
        impact = -5.0
        label = f"Only {tx_count} transactions — very low activity."
    elif tx_count < 20:
        impact = 3.0
        label = f"{tx_count} transactions — low but some activity."
    elif tx_count < 100:
        impact = 7.0
        label = f"{tx_count} transactions — moderate activity, normal usage pattern."
    elif tx_count < 500:
        impact = 10.0
        label = f"{tx_count} transactions — active wallet with consistent history."
    else:
        impact = 5.0  # Very high tx count is slightly less trust (could be bot)
        label = f"{tx_count} transactions — very high activity, check for bot-like patterns."

    return SignalDetail(name="tx_count", value=tx_count, score_impact=impact, label=label)


# ---------------------------------------------------------------------------
# Counterparty Diversity
# ---------------------------------------------------------------------------

def signal_counterparty_diversity(data: WalletData) -> SignalDetail:
    unique = data.get("unique_counterparties", 0)
    tx_count = max(data.get("tx_count", 1), 1)
    diversity_ratio = unique / tx_count

    if unique == 0:
        impact = -8.0
        label = "No counterparties detected — highly isolated wallet."
    elif unique < 3:
        impact = -5.0
        label = f"Only {unique} unique counterparties — very concentrated interactions."
    elif diversity_ratio < 0.1:
        impact = -3.0
        label = f"{unique} counterparties across {tx_count} txs — low diversity, possible concentration."
    elif diversity_ratio > 0.5:
        impact = 8.0
        label = f"{unique} unique counterparties — healthy diversity in interactions."
    else:
        impact = 4.0
        label = f"{unique} unique counterparties — moderate interaction diversity."

    return SignalDetail(
        name="counterparty_diversity",
        value=unique,
        score_impact=impact,
        label=label,
    )


# ---------------------------------------------------------------------------
# Approval Count
# ---------------------------------------------------------------------------

def signal_approval_patterns(data: WalletData) -> SignalDetail:
    approvals = data.get("approval_count", 0)
    tx_count = max(data.get("tx_count", 1), 1)
    ratio = approvals / tx_count

    if approvals == 0:
        impact = 3.0
        label = "No ERC-20 approvals detected — low smart contract exposure."
    elif ratio > 0.5:
        impact = -12.0
        label = f"{approvals} approvals in {tx_count} txs — abnormally high approval rate, possible phishing exposure."
    elif approvals > 20:
        impact = -8.0
        label = f"{approvals} ERC-20 approvals — high number, review approved contracts."
    elif approvals > 10:
        impact = -4.0
        label = f"{approvals} ERC-20 approvals — moderate, common for DeFi users."
    else:
        impact = 2.0
        label = f"{approvals} ERC-20 approvals — normal range."

    return SignalDetail(
        name="approval_patterns",
        value=approvals,
        score_impact=impact,
        label=label,
    )


# ---------------------------------------------------------------------------
# Burst Activity
# ---------------------------------------------------------------------------

def signal_burst_activity(data: WalletData) -> SignalDetail:
    burst = data.get("burst_detected", False)

    if burst:
        impact = -15.0
        label = "Suspicious burst of activity detected — rapid transactions in a short window, possible bot or attack."
    else:
        impact = 5.0
        label = "No suspicious burst activity detected."

    return SignalDetail(
        name="burst_activity",
        value=burst,
        score_impact=impact,
        label=label,
    )


# ---------------------------------------------------------------------------
# Large Inflow / Outflow
# ---------------------------------------------------------------------------

def signal_large_flows(data: WalletData) -> SignalDetail:
    large_in = data.get("large_inflow_detected", False)
    large_out = data.get("large_outflow_detected", False)

    if large_in and large_out:
        impact = -10.0
        label = "Large sudden inflow AND outflow detected — possible mixing or rapid fund movement."
    elif large_out:
        impact = -8.0
        label = "Large sudden outflow detected — funds moved rapidly out of wallet."
    elif large_in:
        impact = -5.0
        label = "Large sudden inflow detected — unexpected large deposit."
    else:
        impact = 4.0
        label = "No large sudden fund movements detected."

    return SignalDetail(
        name="large_flows",
        value=f"inflow={large_in}, outflow={large_out}",
        score_impact=impact,
        label=label,
    )


# ---------------------------------------------------------------------------
# Contract Interaction Rate
# ---------------------------------------------------------------------------

def signal_contract_interaction_rate(data: WalletData) -> SignalDetail:
    contract_interactions = data.get("contract_interactions", 0)
    tx_count = max(data.get("tx_count", 1), 1)
    rate = contract_interactions / tx_count

    if rate > 0.9:
        impact = 5.0
        label = f"High smart contract interaction rate ({rate:.0%}) — active DeFi user."
    elif rate > 0.3:
        impact = 3.0
        label = f"Moderate smart contract interaction rate ({rate:.0%})."
    elif tx_count > 10 and contract_interactions == 0:
        impact = 2.0
        label = "No contract interactions — simple wallet, lower attack surface."
    else:
        impact = 0.0
        label = f"Low contract interaction rate ({rate:.0%})."

    return SignalDetail(
        name="contract_interaction_rate",
        value=round(rate, 2),
        score_impact=impact,
        label=label,
    )


# ---------------------------------------------------------------------------
# Balance Health
# ---------------------------------------------------------------------------

def signal_balance(data: WalletData) -> SignalDetail:
    balance = data.get("balance_eth", 0.0)

    if balance == 0:
        impact = -3.0
        label = "Zero balance — dust or abandoned wallet."
    elif balance < 0.001:
        impact = -1.0
        label = f"Very low balance ({balance:.6f} ETH) — minimal funds."
    elif balance < 1.0:
        impact = 3.0
        label = f"Balance {balance:.4f} ETH — normal range."
    else:
        impact = 5.0
        label = f"Balance {balance:.4f} ETH — healthy balance."

    return SignalDetail(
        name="balance",
        value=round(balance, 6),
        score_impact=impact,
        label=label,
    )


# ---------------------------------------------------------------------------
# Is Contract
# ---------------------------------------------------------------------------

def signal_is_contract(data: WalletData) -> SignalDetail:
    is_contract = data.get("is_contract", False)

    if is_contract:
        impact = -5.0
        label = "Address is a smart contract, not an EOA — different risk profile."
    else:
        impact = 3.0
        label = "Address is an externally owned account (EOA)."

    return SignalDetail(
        name="is_contract",
        value=is_contract,
        score_impact=impact,
        label=label,
    )


# ---------------------------------------------------------------------------
# All signals
# ---------------------------------------------------------------------------

ALL_SIGNALS = [
    signal_wallet_age,
    signal_tx_count,
    signal_counterparty_diversity,
    signal_approval_patterns,
    signal_burst_activity,
    signal_large_flows,
    signal_contract_interaction_rate,
    signal_balance,
    signal_is_contract,
]
