"""
models.py — Shared Pydantic schemas for request/response.
Defines the API contract between frontend and backend.
Owner: Team Member A (Backend/Scoring)
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, field_validator


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AnalyzeRequest(BaseModel):
    address: str

    @field_validator("address")
    @classmethod
    def validate_address(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("Invalid Ethereum/Monad address format")
        return v.lower()


class SignalDetail(BaseModel):
    """A single scored signal contributing to the overall score."""
    name: str
    value: float | int | str | bool | None
    score_impact: float  # positive = good, negative = risky
    label: str           # human-readable description


class WalletScoreResponse(BaseModel):
    """
    Full response returned by POST /api/v1/analyze.
    This is the primary API contract consumed by the frontend.
    """
    address: str
    score: float                    # 0-100, higher = safer
    risk_level: RiskLevel
    positives: List[str]            # trust signals detected
    warnings: List[str]             # risk flags detected
    signals: List[SignalDetail]     # detailed signal breakdown
    explanation: str                # AI-generated or deterministic summary
    confidence: float               # 0.0-1.0 confidence in the analysis
    tx_count: Optional[int] = None
    wallet_age_days: Optional[int] = None
