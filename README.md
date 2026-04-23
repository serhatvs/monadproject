# 🛡️ Monad Wallet Security Scorer

> AI-assisted wallet security scoring on the Monad blockchain.  
> Hackathon MVP — built for the Monad ecosystem.

---

## Project Overview

**Monad Wallet Security Scorer** analyzes any Monad wallet address and returns a transparent, explainable security score from 0 to 100. It combines deterministic on-chain heuristics with an optional AI explanation layer to make wallet risk analysis fast, reliable, and human-readable.

---

## Problem

Blockchain users, dApps, and protocols have no easy way to assess the trustworthiness or risk profile of a wallet address. Existing tools are either too technical, non-transparent, or focused on asset tracking rather than behavior-based risk analysis.

---

## Solution

A lightweight, modular pipeline that:

1. Fetches on-chain wallet data from Monad RPC
2. Runs a set of heuristic signal extractors (wallet age, tx patterns, approvals, etc.)
3. Computes a weighted security score (0–100)
4. Generates a human-readable explanation (deterministic fallback + optional GPT layer)
5. Returns everything via a clean JSON API consumed by a React/Next.js frontend

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  AddressInput → API call → ScoreCard + RiskBreakdown + Explain  │
└────────────────────────┬────────────────────────────────────────┘
                         │ POST /api/v1/analyze
┌────────────────────────▼────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  routes.py → fetch_wallet_data → compute_score → explain        │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ data/fetcher│  │scoring/engine│  │  ai/explainer       │    │
│  │ (Monad RPC) │  │ (signals +   │  │  (GPT-4o-mini or   │    │
│  │             │  │  weights)    │  │   deterministic)    │    │
│  └─────────────┘  └──────────────┘  └─────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                         │
                   Monad Testnet RPC
```

**Monorepo structure:**

```
monadproject/
├── backend/              # Team Member A (Blockchain/Scoring)
│   ├── app/
│   │   ├── main.py       # FastAPI app entry point
│   │   ├── models.py     # Shared Pydantic schemas (API contract)
│   │   ├── api/
│   │   │   └── routes.py # /api/v1/analyze endpoint
│   │   ├── data/
│   │   │   └── fetcher.py  # Monad RPC data fetcher
│   │   ├── scoring/
│   │   │   ├── engine.py   # Weighted score aggregator
│   │   │   └── signals.py  # Individual signal extractors
│   │   └── ai/
│   │       └── explainer.py  # OpenAI / deterministic explanation
│   ├── tests/
│   │   └── test_scoring.py   # Unit tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/             # Team Member B (Frontend/UX/AI)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx      # Main app page
│   │   │   └── layout.tsx    # Root layout
│   │   ├── components/
│   │   │   ├── AddressInput.tsx   # Wallet input form
│   │   │   ├── ScoreCard.tsx      # Score gauge + risk level
│   │   │   ├── RiskBreakdown.tsx  # Signal details list
│   │   │   └── ExplanationPanel.tsx  # AI explanation
│   │   ├── lib/
│   │   │   └── api.ts        # Backend API client
│   │   └── types/
│   │       └── wallet.ts     # Shared TypeScript types
│   └── .env.local.example
└── README.md
```

---

## API Contract

### `POST /api/v1/analyze`

**Request:**
```json
{ "address": "0xabcdef1234567890abcdef1234567890abcdef12" }
```

**Response:**
```json
{
  "address": "0xabcdef...",
  "score": 74.5,
  "risk_level": "low",
  "positives": [
    "Wallet is 200 days old — established history.",
    "47 transactions — moderate activity, normal usage pattern."
  ],
  "warnings": [
    "5 ERC-20 approvals — normal range."
  ],
  "signals": [
    {
      "name": "wallet_age",
      "value": 200,
      "score_impact": 8.0,
      "label": "Wallet is 200 days old — established history."
    }
  ],
  "explanation": "This wallet has a security score of 74.5/100 (LOW risk). ...",
  "confidence": 0.7,
  "tx_count": 47,
  "wallet_age_days": 200
}
```

**Risk Levels:**
| Score | Risk Level |
|-------|-----------|
| 70–100 | `low` |
| 40–69 | `medium` |
| 0–39 | `high` |

---

## Scoring Logic

The engine starts at a neutral baseline of **50 points** and applies each signal's `score_impact`:

| Signal | Range | Direction |
|--------|-------|-----------|
| Wallet age | −15 to +12 | Older = safer |
| Transaction count | −10 to +10 | More (up to ~500) = safer |
| Counterparty diversity | −8 to +8 | More unique = safer |
| Approval patterns | −12 to +3 | Fewer/lower ratio = safer |
| Burst activity | −15 to +5 | No burst = safer |
| Large fund flows | −10 to +4 | No sudden moves = safer |
| Contract interaction rate | 0 to +5 | Moderate = normal |
| Balance | −3 to +5 | Non-zero healthy = safer |
| Is contract (vs EOA) | −5 to +3 | EOA = baseline safer |

Final score = `clamp(50 + Σ signal_impacts, 0, 100)`

Every signal maps directly to a displayed reason — no black-box scoring.

---

## AI Role

- **Primary scoring is deterministic** — heuristics always run.
- **AI (GPT-4o-mini)** is used only to summarize and rephrase the already-computed signals into a friendly explanation.
- The AI prompt receives only computed facts, not raw chain data, preventing hallucinations.
- If `OPENAI_API_KEY` is not set, a deterministic rule-based explanation is used automatically.

---

## Setup

### Prerequisites
- Python 3.11+ and pip
- Node.js 20+ and npm
- (Optional) OpenAI API key for AI explanations

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MONAD_RPC_URL and optionally OPENAI_API_KEY
# Set USE_MOCK_DATA=true to run without a live RPC node

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`  
API docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local if backend runs on a different port

npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Run Tests

```bash
cd backend
python -m pytest tests/ -v
```

---

## Demo Flow

1. Open `http://localhost:3000`
2. Paste any Monad wallet address into the input field
3. Click **Analyze**
4. See:
   - **Score gauge** (0–100) with risk level badge
   - **Trust signals** (green bullets)
   - **Risk warnings** (red bullets)
   - **Full signal breakdown** with impact scores
   - **AI explanation** summarizing the analysis
5. Try a brand new wallet (0 txs) and compare to an established one

---

## Task Split

### Team Member A — Backend/Scoring
- [x] FastAPI app scaffold (`main.py`, `routes.py`)
- [x] Monad RPC data fetcher (`data/fetcher.py`)
- [x] Signal extractors (`scoring/signals.py`)
- [x] Scoring engine with weighted aggregation (`scoring/engine.py`)
- [x] Pydantic models / API contract (`models.py`)
- [x] Unit tests (`tests/test_scoring.py`)
- [x] Backend README and scoring documentation
- [ ] Add more signals (scam pattern detection, token diversity, MEV detection)
- [ ] Connect to a production Monad indexer for full tx history

### Team Member B — Frontend/UX/AI
- [x] Next.js 14 + Tailwind CSS scaffold
- [x] TypeScript API types (`types/wallet.ts`)
- [x] Backend API client (`lib/api.ts`)
- [x] AddressInput component
- [x] ScoreCard component with animated ring gauge
- [x] RiskBreakdown component (signals, warnings, positives)
- [x] ExplanationPanel component
- [x] Main page wiring
- [x] AI explanation integration (`ai/explainer.py`)
- [ ] Animated transitions between states
- [ ] Score history / comparison view
- [ ] Share / export score card

---

## Future Improvements

- **Full tx history indexing** via a dedicated Monad indexer (e.g., Goldsky, custom subgraph)
- **Scam contract database** integration (cross-reference known bad addresses)
- **Token diversity scoring** — analyze ERC-20 portfolio composition
- **NFT pattern analysis** — wash trading, sweep patterns
- **MEV/bot detection** — identify Flashbots-style activity
- **Score history** — track wallet risk over time
- **Batch analysis** — score multiple wallets at once
- **Webhook alerts** — notify when a counterparty's score drops
- **On-chain attestation** — publish score as a verifiable credential

---

## License

MIT — built for the Monad Hackathon.
