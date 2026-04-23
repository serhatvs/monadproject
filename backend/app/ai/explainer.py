"""
explainer.py — AI-assisted explanation layer.
Owner: Team Member B (Frontend/AI) with guidance from Team Member A.

Uses OpenAI to generate a human-readable summary of the wallet score.
Falls back to the deterministic explanation if OpenAI is unavailable or not configured.
"""

from __future__ import annotations

import os

from app.models import WalletScoreResponse

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


async def generate_explanation(result: WalletScoreResponse) -> str:
    """
    Generate an AI explanation for the wallet score.
    Returns the deterministic explanation if OpenAI is not configured.
    """
    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-...":
        return _deterministic_explanation(result)

    try:
        return await _openai_explanation(result)
    except Exception:
        return _deterministic_explanation(result)


def _deterministic_explanation(result: WalletScoreResponse) -> str:
    """
    Rule-based fallback explanation. Always works, no external dependency.
    """
    risk = result.risk_level.value.upper()
    score = result.score
    n_warn = len(result.warnings)
    n_pos = len(result.positives)

    intro = f"This wallet has a security score of {score}/100, indicating {risk} risk."

    if n_warn == 0:
        risk_part = "No significant risk signals were detected."
    elif n_warn == 1:
        risk_part = f"One risk signal was detected: {result.warnings[0]}"
    else:
        top_warnings = "; ".join(result.warnings[:3])
        risk_part = f"Key risk signals include: {top_warnings}."

    if n_pos == 0:
        trust_part = "No strong trust signals were found."
    elif n_pos == 1:
        trust_part = f"One positive signal: {result.positives[0]}"
    else:
        trust_part = f"Positive signals include: {'; '.join(result.positives[:2])}."

    return f"{intro} {risk_part} {trust_part}"


async def _openai_explanation(result: WalletScoreResponse) -> str:
    """
    Uses OpenAI chat completions to produce a concise, user-friendly summary.
    The prompt provides only computed facts — no hallucinations.
    """
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    positives_text = "\n".join(f"- {p}" for p in result.positives) or "None"
    warnings_text = "\n".join(f"- {w}" for w in result.warnings) or "None"

    prompt = f"""You are a blockchain security analyst. Based on the following computed wallet analysis data, write a 2-3 sentence plain-English explanation for a non-technical user. Do NOT invent any facts not present below.

Wallet: {result.address}
Score: {result.score}/100
Risk Level: {result.risk_level.value}
Confidence: {result.confidence:.0%}
Transaction Count: {result.tx_count}
Wallet Age (days): {result.wallet_age_days}

Positive signals:
{positives_text}

Risk warnings:
{warnings_text}

Write a concise, friendly explanation:"""

    response = await client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.4,
    )
    return response.choices[0].message.content.strip()
