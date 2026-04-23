/**
 * page.tsx — Main page for Monad Wallet Security Scorer.
 * Owner: Team Member B (Frontend/UX)
 */

"use client";

import { useState } from "react";
import { analyzeWallet } from "@/lib/api";
import { WalletScoreResponse } from "@/types/wallet";
import AddressInput from "@/components/AddressInput";
import ScoreCard from "@/components/ScoreCard";
import RiskBreakdown from "@/components/RiskBreakdown";
import ExplanationPanel from "@/components/ExplanationPanel";
import { Shield } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WalletScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(address: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeWallet(address);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Shield className="h-7 w-7 text-purple-400" />
          <span className="text-lg font-bold tracking-tight">
            Monad Wallet Scorer
          </span>
          <span className="ml-auto text-xs text-white/30 font-mono">MVP v0.1</span>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Wallet Security{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Scoring
          </span>
        </h1>
        <p className="text-white/60 text-lg max-w-xl mx-auto mb-10">
          Analyze any Monad wallet address for risk signals, trust indicators,
          and get an AI-assisted security score in seconds.
        </p>
        <AddressInput onSubmit={handleAnalyze} loading={loading} />
      </section>

      {/* Error */}
      {error && (
        <div className="max-w-2xl mx-auto px-6 mb-8">
          <div className="rounded-xl bg-red-500/20 border border-red-500/30 p-4 text-red-300 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <section className="max-w-5xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score card — left column */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <ScoreCard result={result} />
            <ExplanationPanel result={result} />
          </div>

          {/* Risk breakdown — right columns */}
          <div className="md:col-span-2">
            <RiskBreakdown result={result} />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-white/20">
        Monad Wallet Scorer · Hackathon MVP · Built on Monad
      </footer>
    </div>
  );
}
