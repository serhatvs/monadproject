"use client";

import { useState } from "react";
import { WalletScoreResponse } from "@/types/wallet";
import { Check, Clipboard, Sparkles } from "lucide-react";

interface Props {
  result: WalletScoreResponse;
}

function formatAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function ExplanationPanel({ result }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="rounded-2xl border border-[#d8e3ed] bg-white p-6 shadow-sm shadow-[#132033]/5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#132033]">AI Analysis</h3>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy address"
          aria-label="Copy wallet address"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8e3ed] bg-[#eef5f8] text-[#8fa1b3] transition-colors hover:border-[#2563eb]/30 hover:text-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#93c5fd]/50"
        >
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Clipboard className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="rounded-xl bg-[#eef5f8] p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#132033]">
              {formatAddress(result.address)}
            </p>
            <p className="text-xs text-[#b8c7d6]">
              Confidence {(result.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[#52677d]">
          {result.explanation}
        </p>
      </div>
    </article>
  );
}
