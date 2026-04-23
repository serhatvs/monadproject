/**
 * ExplanationPanel.tsx — Displays the AI-generated or deterministic explanation.
 * Owner: Team Member B (Frontend/AI)
 */

"use client";

import { WalletScoreResponse } from "@/types/wallet";
import { Sparkles } from "lucide-react";

interface Props {
  result: WalletScoreResponse;
}

export default function ExplanationPanel({ result }: Props) {
  return (
    <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-300 uppercase tracking-wide mb-3">
        <Sparkles className="h-4 w-4" />
        AI Analysis
      </h3>
      <p className="text-white/85 text-sm leading-relaxed">{result.explanation}</p>
      <p className="mt-3 text-xs text-white/30">
        Confidence: {(result.confidence * 100).toFixed(0)}% · Address:{" "}
        <span className="font-mono">{result.address}</span>
      </p>
    </div>
  );
}
