/**
 * api.ts — Backend API client for wallet scoring.
 * Owner: Team Member B (Frontend)
 *
 * TODO (Team Member B): Update BACKEND_URL for production deployment.
 */

import { AnalyzeRequest, WalletScoreResponse } from "@/types/wallet";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function analyzeWallet(
  address: string
): Promise<WalletScoreResponse> {
  const body: AnalyzeRequest = { address };

  const res = await fetch(`${BACKEND_URL}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<WalletScoreResponse>;
}
