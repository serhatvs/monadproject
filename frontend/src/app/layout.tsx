import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monad Wallet Security Scorer",
  description:
    "AI-assisted wallet security scoring on the Monad blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-background text-foreground antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
