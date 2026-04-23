"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { analyzeWallet } from "@/lib/api";
import { WalletScoreResponse } from "@/types/wallet";
import ScoreCard from "@/components/ScoreCard";
import RiskBreakdown from "@/components/RiskBreakdown";
import ExplanationPanel from "@/components/ExplanationPanel";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  Shield,
  ShieldAlert,
  Activity,
  X,
} from "lucide-react";

function isWalletAddress(address: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

function QuickStatsPanel({ result }: { result: WalletScoreResponse }) {
  const stats = [
    {
      label: "Transactions",
      value: result.tx_count?.toString() ?? "--",
      Icon: Activity,
      className: "text-[#2563eb]",
    },
    {
      label: "Wallet Age",
      value: result.wallet_age_days != null ? `${result.wallet_age_days}d` : "--",
      Icon: CalendarDays,
      className: "text-[#123a72]",
    },
    {
      label: "Confidence",
      value: `${(result.confidence * 100).toFixed(0)}%`,
      Icon: CheckCircle2,
      className: "text-emerald-600",
    },
    {
      label: "Warnings",
      value: result.warnings.length.toString(),
      Icon: ShieldAlert,
      className: "text-amber-500",
    },
  ];

  return (
    <article className="rounded-2xl border border-[#d8e3ed] bg-white p-6 shadow-sm shadow-[#132033]/5">
      <h3 className="mb-4 text-base font-semibold text-[#132033]">
        Quick Stats
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => {
          const Icon = stat.Icon;

          return (
            <div key={stat.label} className="rounded-xl bg-[#eef5f8] p-4 text-center">
              <Icon className={`mx-auto mb-2 h-5 w-5 ${stat.className}`} />
              <p className={`text-2xl font-bold ${stat.className}`}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-[#b8c7d6]">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function AiReportModal({
  result,
  onClose,
}: {
  result: WalletScoreResponse;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#132033]/30 px-4 backdrop-blur-sm">
      <section className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#d8e3ed] bg-white p-6 shadow-2xl shadow-[#132033]/20">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#2563eb]">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#132033]">AI Report</h2>
              <p className="mt-1 break-all font-mono text-xs text-[#8fa1b3]">
                {result.address}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI report"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8e3ed] bg-[#eef5f8] text-[#8fa1b3] transition-colors hover:border-[#2563eb]/30 hover:text-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#93c5fd]/50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[#eef5f8] p-4">
            <p className="text-xs text-[#8fa1b3]">Score</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[#2563eb]">
              {result.score.toFixed(0)}
            </p>
          </div>
          <div className="rounded-xl bg-[#eef5f8] p-4">
            <p className="text-xs text-[#8fa1b3]">Risk Level</p>
            <p className="mt-1 text-2xl font-bold capitalize text-[#123a72]">
              {result.risk_level}
            </p>
          </div>
          <div className="rounded-xl bg-[#eef5f8] p-4">
            <p className="text-xs text-[#8fa1b3]">Confidence</p>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-600">
              {(result.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#d8e3ed] bg-[#f8fbfd] p-5">
          <p className="text-sm leading-7 text-[#52677d]">
            {result.explanation}
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#132033]">
              Trust Signals
            </h3>
            <div className="space-y-2">
              {result.positives.map((item, index) => (
                <p
                  key={`${item}-${index}`}
                  className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#132033]">
              Risk Flags
            </h3>
            <div className="space-y-2">
              {result.warnings.map((item, index) => (
                <p
                  key={`${item}-${index}`}
                  className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700"
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function RiskAnalysisClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedAddress = searchParams.get("address")?.trim() ?? "";
  const lastAnalyzedRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WalletScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const invalidAddressError =
    requestedAddress && !isWalletAddress(requestedAddress)
      ? "Enter a valid 0x address with 40 hexadecimal characters."
      : null;
  const missingAddressError = !requestedAddress ? "No wallet address provided." : null;
  const visibleError = missingAddressError ?? invalidAddressError ?? error;
  const visibleResult = invalidAddressError ? null : result;

  const runAnalysis = useCallback(
    async (address: string) => {
      const trimmed = address.trim();
      lastAnalyzedRef.current = trimmed;
      setLoading(true);
      setError(null);
      setResult(null);
      setReportOpen(false);

      try {
        const data = await analyzeWallet(trimmed);
        setResult(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error occurred.");
      } finally {
        setLoading(false);
      }
    },
    [setError, setLoading, setReportOpen, setResult]
  );

  useEffect(() => {
    if (!requestedAddress) {
      return;
    }

    if (!isWalletAddress(requestedAddress)) {
      return;
    }

    if (lastAnalyzedRef.current === requestedAddress) {
      return;
    }

    void runAnalysis(requestedAddress);
  }, [requestedAddress, runAnalysis]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f7fb] text-[#132033]">
      <div className="console-grid pointer-events-none fixed inset-0 opacity-80" />

      <header className="sticky top-0 z-50 border-b border-[#d8e3ed] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              aria-label="Go to wallet entry"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#123a72] text-white shadow-lg shadow-[#2563eb]/25 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#93c5fd]"
            >
              <Shield className="h-5 w-5" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight text-[#132033]">
                Monad Shield
              </h1>
              <p className="text-xs text-[#b8c7d6]">Security Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Scan status"
              className="relative rounded-xl p-2.5 transition-colors hover:bg-[#eef5f8] focus:outline-none focus:ring-2 focus:ring-[#93c5fd]"
            >
              <Bell className="h-5 w-5 text-[#b8c7d6]" aria-hidden="true" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8e3ed] bg-gradient-to-br from-[#2563eb]/20 to-[#123a72]/20">
              <span className="text-sm font-semibold text-[#123a72]">MW</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12">
        {loading && (
          <div className="flex min-h-[55vh] items-center justify-center">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-[#d8e3ed] bg-white px-5 py-4 text-sm font-semibold text-[#34526f] shadow-sm shadow-[#132033]/5">
              <Loader2 className="h-5 w-5 animate-spin text-[#2563eb]" />
              Analyzing wallet
            </div>
          </div>
        )}

        {!loading && visibleError && (
          <div className="flex min-h-[55vh] items-center justify-center">
            <div className="flex max-w-md items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm shadow-[#132033]/5">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{visibleError}</span>
            </div>
          </div>
        )}

        {!loading && !visibleError && visibleResult && (
          <>
            <div className="grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <ScoreCard
                  result={visibleResult}
                  scanning={loading}
                  onRunFullScan={() => void runAnalysis(visibleResult.address)}
                  onViewReport={() => setReportOpen(true)}
                />
              </div>

              <div className="space-y-6 lg:col-span-2">
                <QuickStatsPanel result={visibleResult} />
                <ExplanationPanel result={visibleResult} />
              </div>
            </div>

            <div className="mt-8">
              <RiskBreakdown result={visibleResult} />
            </div>
          </>
        )}
      </main>

      {reportOpen && visibleResult && (
        <AiReportModal
          result={visibleResult}
          onClose={() => setReportOpen(false)}
        />
      )}

      <footer className="relative mt-12 border-t border-[#d8e3ed] bg-white/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <p className="text-sm text-[#b8c7d6]">
            Monad Wallet Scorer | Hackathon MVP
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm text-[#b8c7d6] transition-colors hover:text-[#2563eb]"
          >
            New scan
          </button>
        </div>
      </footer>
    </div>
  );
}
