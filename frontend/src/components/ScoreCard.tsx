"use client";

import { useEffect, useState } from "react";
import { WalletScoreResponse } from "@/types/wallet";
import { ShieldAlert, ShieldCheck } from "lucide-react";

interface Props {
  result: WalletScoreResponse;
  scanning: boolean;
  onRunFullScan: () => void;
  onViewReport: () => void;
}

const riskConfig = {
  low: {
    color: "#16a34a",
    label: "Strong",
    summary: "This wallet shows a healthier behavioral risk profile.",
    Icon: ShieldCheck,
  },
  medium: {
    color: "#eab308",
    label: "Watch",
    summary: "This wallet has mixed signals that deserve a closer look.",
    Icon: ShieldAlert,
  },
  high: {
    color: "#ef4444",
    label: "At Risk",
    summary: "This wallet returned risk signals that should be reviewed.",
    Icon: ShieldAlert,
  },
};

function formatScore(score: number) {
  return Number.isInteger(score) ? score.toString() : score.toFixed(1);
}

function AnimatedScoreRing({
  score,
  statusColor,
}: {
  score: number;
  statusColor: string;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const size = 240;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    let frame = 0;
    const duration = 1200;
    const startTime = performance.now();
    const target = Math.max(0, Math.min(100, score));

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setAnimatedScore(Number((target * eased).toFixed(1)));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute rounded-full opacity-20 blur-2xl"
        style={{
          width: size - 40,
          height: size - 40,
          background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
        }}
      />

      <svg
        width={size}
        height={size}
        className="relative z-10 -rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#123a72" />
          </linearGradient>
          <filter id="scoreGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e8edf3"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter="url(#scoreGlow)"
        />
      </svg>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        <span className="mb-1 text-[11px] font-medium uppercase text-[#b8c7d6]">
          Security Score
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-[56px] font-bold leading-none text-[#132033]">
            {formatScore(animatedScore)}
          </span>
          <span className="text-lg font-semibold text-[#b8c7d6]">/100</span>
        </div>
        <span
          className="mt-1 rounded-full px-3 py-0.5 text-xs font-semibold"
          style={{
            color: statusColor,
            backgroundColor: `${statusColor}15`,
          }}
        >
          {riskConfig.low.color === statusColor ? "Excellent" : riskConfig.medium.color === statusColor ? "Review" : "At Risk"}
        </span>
      </div>
    </div>
  );
}

export default function ScoreCard({
  result,
  scanning,
  onRunFullScan,
  onViewReport,
}: Props) {
  const cfg = riskConfig[result.risk_level];
  const { Icon } = cfg;

  return (
    <article className="rounded-2xl border border-[#d8e3ed] bg-white p-8 shadow-sm shadow-[#132033]/5 sm:p-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-sm font-medium text-[#b8c7d6]">
            Wallet scan complete
          </span>
        </div>
        <span className="text-xs text-[#b8c7d6]">Last updated: Just now</span>
      </div>

      <div className="mb-10 flex justify-center">
        <AnimatedScoreRing score={result.score} statusColor={cfg.color} />
      </div>

      <div className="mx-auto max-w-md text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Icon className="h-5 w-5" style={{ color: cfg.color }} />
          <h3 className="text-xl font-semibold text-[#132033]">
            {cfg.label} Security Posture
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-[#8fa1b3]">{cfg.summary}</p>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={onRunFullScan}
          disabled={scanning}
          className="rounded-xl bg-gradient-to-r from-[#2563eb] to-[#123a72] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#2563eb]/25 focus:outline-none focus:ring-2 focus:ring-[#93c5fd] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {scanning ? "Scanning" : "Run Full Scan"}
        </button>
        <button
          type="button"
          onClick={onViewReport}
          className="rounded-xl border border-[#d8e3ed] bg-[#eef5f8] px-6 py-2.5 text-sm font-semibold text-[#132033] transition-all duration-200 hover:border-[#2563eb]/30 hover:bg-[#e8edf3] focus:outline-none focus:ring-2 focus:ring-[#93c5fd]"
        >
          View Report
        </button>
      </div>
    </article>
  );
}
