"use client";

import { useState } from "react";
import { WalletScoreResponse } from "@/types/wallet";
import {
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  MinusCircle,
} from "lucide-react";

interface Props {
  result: WalletScoreResponse;
}

type View = "signals" | "flags" | "trust";

function impactTone(impact: number) {
  if (impact > 0) {
    return {
      Icon: CheckCircle2,
      text: "text-emerald-600",
      dot: "bg-emerald-500",
      panel: "bg-emerald-100",
    };
  }

  if (impact < 0) {
    return {
      Icon: AlertTriangle,
      text: "text-red-600",
      dot: "bg-red-500",
      panel: "bg-red-100",
    };
  }

  return {
    Icon: MinusCircle,
    text: "text-[#8fa1b3]",
    dot: "bg-blue-500",
    panel: "bg-blue-100",
  };
}

function SignalMetric({
  label,
  impact,
  value,
}: {
  label: string;
  impact: number;
  value: string | number | boolean | null;
}) {
  const tone = impactTone(impact);
  const Icon = tone.Icon;
  const impactStr = impact > 0 ? `+${impact.toFixed(1)}` : impact.toFixed(1);

  return (
    <div className="rounded-xl border border-[#d8e3ed]/60 bg-[#eef5f8] p-4 transition-colors duration-200 hover:border-[#2563eb]/30">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone.panel} ${tone.text}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
      </div>
      <p className="truncate text-xs font-medium text-[#8fa1b3]">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold text-[#132033]">
          {value === null ? "Unknown" : String(value)}
        </p>
        <span className={`font-mono text-sm font-semibold ${tone.text}`}>
          {impactStr}
        </span>
      </div>
    </div>
  );
}

function TextList({
  items,
  empty,
  tone,
}: {
  items: string[];
  empty: string;
  tone: "risk" | "trust";
}) {
  const Icon = tone === "risk" ? AlertTriangle : CheckCircle2;
  const iconStyle =
    tone === "risk"
      ? "bg-red-100 text-red-600"
      : "bg-emerald-100 text-emerald-600";

  if (items.length === 0) {
    return <p className="py-8 text-sm text-[#8fa1b3]">{empty}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-center gap-3 rounded-lg p-3 transition-colors duration-150 hover:bg-[#eef5f8]"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconStyle}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium text-[#132033]">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function RiskBreakdown({ result }: Props) {
  const [view, setView] = useState<View>("signals");
  const sortedSignals = [...result.signals].sort(
    (a, b) => Math.abs(b.score_impact) - Math.abs(a.score_impact)
  );

  const tabs = [
    {
      id: "signals" as const,
      label: "Signals",
      count: result.signals.length,
      Icon: ListChecks,
    },
    {
      id: "flags" as const,
      label: "Flags",
      count: result.warnings.length,
      Icon: AlertTriangle,
    },
    {
      id: "trust" as const,
      label: "Trust",
      count: result.positives.length,
      Icon: CheckCircle2,
    },
  ];

  return (
    <article className="rounded-2xl border border-[#d8e3ed] bg-white p-6 shadow-sm shadow-[#132033]/5">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-[#132033]">
          Security Metrics
        </h3>
        <div
          role="tablist"
          aria-label="Risk breakdown views"
          className="grid grid-cols-3 gap-1 rounded-xl border border-[#d8e3ed] bg-[#eef5f8] p-1"
        >
          {tabs.map((tab) => {
            const Icon = tab.Icon;
            const active = view === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setView(tab.id)}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[#2563eb] text-white shadow-sm"
                    : "text-[#8fa1b3] hover:bg-white hover:text-[#2563eb]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="font-mono">{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {view === "signals" && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sortedSignals.map((sig) => (
            <SignalMetric
              key={sig.name}
              label={sig.label}
              impact={sig.score_impact}
              value={sig.value}
            />
          ))}
        </div>
      )}

      {view === "flags" && (
        <TextList
          items={result.warnings}
          empty="No risk flags returned."
          tone="risk"
        />
      )}

      {view === "trust" && (
        <TextList
          items={result.positives}
          empty="No trust signals returned."
          tone="trust"
        />
      )}
    </article>
  );
}
