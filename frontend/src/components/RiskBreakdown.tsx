/**
 * RiskBreakdown.tsx — Shows individual signals, warnings, and trust flags.
 * Owner: Team Member B (Frontend/UX)
 */

"use client";

import { WalletScoreResponse } from "@/types/wallet";
import { CheckCircle, AlertTriangle, MinusCircle } from "lucide-react";

interface Props {
  result: WalletScoreResponse;
}

function SignalRow({
  label,
  impact,
}: {
  label: string;
  impact: number;
}) {
  const isPositive = impact > 0;
  const isNeutral = impact === 0;

  const Icon = isNeutral
    ? MinusCircle
    : isPositive
    ? CheckCircle
    : AlertTriangle;

  const color = isNeutral
    ? "text-white/40"
    : isPositive
    ? "text-green-400"
    : "text-red-400";

  const impactStr =
    impact > 0 ? `+${impact.toFixed(1)}` : impact.toFixed(1);

  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/10 last:border-0">
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
      <p className="flex-1 text-sm text-white/80">{label}</p>
      <span className={`text-xs font-mono font-semibold ${color}`}>
        {impactStr}
      </span>
    </div>
  );
}

export default function RiskBreakdown({ result }: Props) {
  const sorted = [...result.signals].sort(
    (a, b) => a.score_impact - b.score_impact
  );

  return (
    <div className="rounded-2xl border border-white/20 bg-white/5 p-6 flex flex-col gap-6">
      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risk Flags ({result.warnings.length})
          </h3>
          <ul className="space-y-1">
            {result.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/75">
                <span className="text-red-400 mt-0.5">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Positives */}
      {result.positives.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Trust Signals ({result.positives.length})
          </h3>
          <ul className="space-y-1">
            {result.positives.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/75">
                <span className="text-green-400 mt-0.5">•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full signal breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">
          Signal Breakdown
        </h3>
        <div>
          {sorted.map((sig) => (
            <SignalRow
              key={sig.name}
              label={sig.label}
              impact={sig.score_impact}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
