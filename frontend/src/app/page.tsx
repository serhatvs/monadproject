"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddressInput from "@/components/AddressInput";
import {
  ArrowRight,
  BadgeCheck,
  Gauge,
  LockKeyhole,
  Shield,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [routing, setRouting] = useState(false);

  function handleWalletEntry(address: string) {
    setRouting(true);
    router.push(`/risk-analysis?address=${encodeURIComponent(address)}`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f7fb] text-[#132033]">
      <div className="console-grid pointer-events-none fixed inset-0 opacity-80" />

      <header className="relative border-b border-[#d8e3ed] bg-white/85 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563eb] text-white shadow-[0_10px_30px_rgba(37,99,235,0.24)]">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-base font-semibold text-[#132033]">
              Monad Wallet Scorer
            </p>
            <p className="text-xs text-[#52677d]">Public wallet entry</p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid min-h-[calc(100vh-145px)] w-full max-w-6xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full max-w-3xl rounded-lg border border-[#d8e3ed] bg-white/90 p-5 shadow-[0_24px_70px_rgba(42,70,100,0.14)] backdrop-blur sm:p-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-md border border-[#c7dcff] bg-[#eef6ff] px-3 py-2 text-sm font-medium text-[#17488f]">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Public wallet lookup
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-[#d8e3ed] bg-white px-3 py-2 text-sm font-medium text-[#52677d] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
              Ready
            </span>
          </div>

          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#2563eb]">
              Start with a public address
            </p>
            <h1 className="mt-3 text-4xl font-bold text-[#10243e] sm:text-5xl">
              Enter a wallet to open its risk analysis.
            </h1>
            <p className="mt-4 text-base leading-7 text-[#52677d] sm:text-lg">
              Paste any public Monad wallet address. The next screen will run
              the risk scan and show the full security breakdown.
            </p>
          </div>

          <div className="mt-8">
            <AddressInput onSubmit={handleWalletEntry} loading={routing} />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Public only",
                Icon: BadgeCheck,
              },
              {
                label: "Risk score",
                Icon: Gauge,
              },
              {
                label: "Send to analysis",
                Icon: ArrowRight,
              },
            ].map((item) => {
              const Icon = item.Icon;

              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-lg border border-[#d8e3ed] bg-[#f7fafc] px-4 py-3 text-sm font-medium text-[#34526f]"
                >
                  <Icon className="h-4 w-4 text-[#2563eb]" aria-hidden="true" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="relative border-t border-[#d8e3ed] bg-white/65 px-4 py-5 text-center text-xs text-[#6b7f93] sm:px-6 lg:px-8">
        Monad Wallet Scorer | Hackathon MVP | Built on Monad
      </footer>
    </div>
  );
}
