/**
 * layout.tsx — Root layout for Monad Wallet Security Scorer.
 * Owner: Team Member B (Frontend/UX)
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monad Wallet Security Scorer",
  description:
    "AI-assisted wallet security scoring on the Monad blockchain. Analyze any wallet address for risk signals and trust indicators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
