"use client";

import { useId, useState } from "react";
import { Loader2, Search, Wallet } from "lucide-react";

interface Props {
  onSubmit: (address: string) => void;
  loading: boolean;
}

export default function AddressInput({ onSubmit, loading }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const inputId = useId();

  function validate(addr: string): boolean {
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      setError("Enter a valid 0x address with 40 hexadecimal characters.");
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
    <form onSubmit={handleSubmit} className="w-full">
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-semibold text-[#253a52]"
      >
        Wallet address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Wallet
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7f93]"
            aria-hidden="true"
          />
          <input
            id={inputId}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            placeholder="0x0000000000000000000000000000000000000000"
            className="h-12 w-full rounded-lg border border-[#c9d8e6] bg-white pl-12 pr-4 font-mono text-sm text-[#132033] outline-none transition placeholder:text-[#98a9ba] focus:border-[#2563eb] focus:ring-2 focus:ring-[#93c5fd]/40 disabled:cursor-not-allowed disabled:bg-[#eef5f8] disabled:opacity-70"
            disabled={loading}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="none"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="inline-flex h-12 min-w-36 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#93c5fd] focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:bg-[#9ebce9] disabled:shadow-none"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-5 w-5" aria-hidden="true" />
          )}
          {loading ? "Analyzing" : "Analyze"}
        </button>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </form>
  );
}
