import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LegalMetrics — Compliance Platform",
  description:
    "Modern enforcement dashboard for Legal Metrology compliance monitoring, inspection audits, and violation tracking across India.",
  keywords: [
    "legal metrology",
    "compliance",
    "inspection",
    "enforcement",
    "India",
  ],
};

import AuthProvider from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-zinc-950 text-zinc-50 font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
