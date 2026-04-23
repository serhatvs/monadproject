/**
 * AddressInput.tsx — Wallet address input form.
 * Owner: Team Member B (Frontend/UX)
 */

"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface Props {
  onSubmit: (address: string) => void;
  loading: boolean;
}

export default function AddressInput({ onSubmit, loading }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function validate(addr: string): boolean {
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      setError("Enter a valid Ethereum/Monad address (0x followed by 40 hex characters).");
      return false;
    }
    setError("");
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (validate(trimmed)) {
      onSubmit(trimmed);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto flex flex-col gap-3"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError("");
          }}
          placeholder="0x… enter a Monad wallet address"
          className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur"
          disabled={loading}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400 pl-1">{error}</p>}
    </form>
  );
}
