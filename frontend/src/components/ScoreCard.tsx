/**
 * ScoreCard.tsx — Displays the overall security score and risk level.
 * Owner: Team Member B (Frontend/UX)
 */

"use client";

import { WalletScoreResponse } from "@/types/wallet";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface Props {
  result: WalletScoreResponse;
}

const riskConfig = {
  low: {
    color: "text-green-400",
    bg: "bg-green-500/20 border-green-500/40",
    ring: "stroke-green-400",
    label: "LOW RISK",
    Icon: ShieldCheck,
  },
  medium: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/20 border-yellow-500/40",
    ring: "stroke-yellow-400",
    label: "MEDIUM RISK",
    Icon: Shield,
  },
  high: {
    color: "text-red-400",
    bg: "bg-red-500/20 border-red-500/40",
    ring: "stroke-red-400",
    label: "HIGH RISK",
    Icon: ShieldAlert,
  },
};

function ScoreRing({ score, ring }: { score: number; ring: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <svg width="140" height="140" className="-rotate-90">
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="10"
      />
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        className={ring}
        strokeWidth="10"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ScoreCard({ result }: Props) {
  const cfg = riskConfig[result.risk_level];
  const { Icon } = cfg;

  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col items-center gap-4 ${cfg.bg}`}
    >
      <div className="relative flex items-center justify-center">
        <ScoreRing score={result.score} ring={cfg.ring} />
        <div className="absolute flex flex-col items-center">
          <span className={`text-4xl font-bold ${cfg.color}`}>
            {result.score}
          </span>
          <span className="text-xs text-white/50">/ 100</span>
        </div>
      </div>

      <div className={`flex items-center gap-2 font-semibold ${cfg.color}`}>
        <Icon className="h-5 w-5" />
        {cfg.label}
      </div>

      <div className="grid grid-cols-2 gap-4 w-full text-center text-sm text-white/70">
        <div>
          <p className="text-white font-medium">
            {result.tx_count ?? "—"}
          </p>
          <p>Transactions</p>
        </div>
        <div>
          <p className="text-white font-medium">
            {result.wallet_age_days != null
              ? `${result.wallet_age_days}d`
              : "—"}
          </p>
          <p>Wallet Age</p>
        </div>
      </div>

      <div className="text-xs text-white/40">
        Confidence: {(result.confidence * 100).toFixed(0)}%
      </div>
    </div>
  );
}
