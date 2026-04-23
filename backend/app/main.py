"""
main.py — FastAPI application entry point.
Owner: Team Member A (Backend/Scoring)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.routes import router

load_dotenv()

app = FastAPI(
    title="Monad Wallet Security Scorer",
    description="Analyzes a Monad wallet address and returns a security score with risk breakdown.",
    version="0.1.0",
)

# Allow frontend dev server and any deployed origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/")
def health():
    return {"status": "ok", "service": "monad-wallet-scorer"}
