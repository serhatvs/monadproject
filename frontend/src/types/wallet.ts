/**
 * wallet.ts — Shared TypeScript types matching the backend API schema.
 * Owner: Team Member A defines these; Team Member B consumes them.
 *
 * Keep in sync with backend/app/models.py
 */

export type RiskLevel = "low" | "medium" | "high";

export interface SignalDetail {
  name: string;
  value: number | string | boolean | null;
  score_impact: number;
  label: string;
}

export interface WalletScoreResponse {
  address: string;
  score: number;           // 0–100, higher = safer
  risk_level: RiskLevel;
  positives: string[];     // trust signals
  warnings: string[];      // risk flags
  signals: SignalDetail[];  // full breakdown
  explanation: string;     // AI or deterministic summary
  confidence: number;      // 0.0–1.0
  tx_count: number | null;
  wallet_age_days: number | null;
}

export interface AnalyzeRequest {
  address: string;
}
