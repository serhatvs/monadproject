"""
engine.py — Scoring engine: aggregates signals into a 0-100 score.
Owner: Team Member A (Backend/Scoring)

Scoring approach:
  1. Start at a neutral baseline (50 points).
  2. Apply each signal's score_impact (positive or negative).
  3. Clamp the result to [0, 100].
  4. Derive risk_level from the final score.
  5. Separate signals into positives and warnings lists.
  6. Compute a confidence value based on data completeness.

Risk levels:
  score >= 70  → LOW risk
  score >= 40  → MEDIUM risk
  score <  40  → HIGH risk
"""

from __future__ import annotations

import time
from typing import Any, Dict, List

from app.models import RiskLevel, SignalDetail, WalletScoreResponse
from app.scoring.signals import ALL_SIGNALS

WalletData = Dict[str, Any]

BASELINE = 50.0


def _risk_level(score: float) -> RiskLevel:
    if score >= 70:
        return RiskLevel.LOW
    if score >= 40:
        return RiskLevel.MEDIUM
    return RiskLevel.HIGH


def _confidence(data: WalletData, signals: List[SignalDetail]) -> float:
    """
    Rough confidence estimate:
    - More transactions → more data → higher confidence.
    - If using mock data we trust it less.
    Capped at 0.95 for humility.
    """
    tx_count = data.get("tx_count", 0)
    if tx_count == 0:
        return 0.3
    if tx_count < 10:
        return 0.5
    if tx_count < 50:
        return 0.7
    if tx_count < 200:
        return 0.85
    return 0.95


def compute_score(address: str, wallet_data: WalletData) -> WalletScoreResponse:
    """Evaluate all signals and return a WalletScoreResponse."""
    signals: List[SignalDetail] = [fn(wallet_data) for fn in ALL_SIGNALS]

    raw_score = BASELINE + sum(s.score_impact for s in signals)
    score = round(max(0.0, min(100.0, raw_score)), 1)

    positives = [s.label for s in signals if s.score_impact > 0]
    warnings = [s.label for s in signals if s.score_impact < 0]

    confidence = _confidence(wallet_data, signals)

    # Placeholder explanation — will be replaced by AI layer
    explanation = (
        f"Wallet {address} received a security score of {score}/100 "
        f"({_risk_level(score).value} risk). "
        f"Found {len(positives)} positive signal(s) and {len(warnings)} warning(s)."
    )

    return WalletScoreResponse(
        address=address,
        score=score,
        risk_level=_risk_level(score),
        positives=positives,
        warnings=warnings,
        signals=signals,
        explanation=explanation,
        confidence=confidence,
        tx_count=wallet_data.get("tx_count"),
        wallet_age_days=_wallet_age_days(wallet_data),
    )


def _wallet_age_days(data: WalletData):
    ts = data.get("first_tx_timestamp")
    if ts is None:
        return None
    return int((time.time() - ts) / 86400)
