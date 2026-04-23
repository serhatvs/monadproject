"""
routes.py — FastAPI router for wallet scoring endpoints.
Owner: Team Member A (Backend/Scoring)
"""

from fastapi import APIRouter, HTTPException

from app.models import AnalyzeRequest, WalletScoreResponse
from app.data.fetcher import fetch_wallet_data
from app.scoring.engine import compute_score
from app.ai.explainer import generate_explanation

router = APIRouter()


@router.post("/analyze", response_model=WalletScoreResponse)
async def analyze_wallet(req: AnalyzeRequest) -> WalletScoreResponse:
    """
    Analyze a wallet address and return its security score.

    Steps:
    1. Fetch onchain data for the address
    2. Compute heuristic signals and weighted score
    3. Generate AI-assisted explanation (falls back to deterministic if AI unavailable)
    4. Return structured response
    """
    try:
        wallet_data = await fetch_wallet_data(req.address)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch wallet data: {e}")

    result = compute_score(req.address, wallet_data)

    # AI explanation — enriches the summary; falls back gracefully
    explanation = await generate_explanation(result)
    result.explanation = explanation

    return result


@router.get("/health")
def health():
    return {"status": "ok"}
