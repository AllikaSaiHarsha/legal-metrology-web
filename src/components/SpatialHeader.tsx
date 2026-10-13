"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Scale, ShieldCheck, Sparkles, LogOut, ScanSearch } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SpatialHeaderProps {
  currentSection?: string;
  action?: React.ReactNode;
}

export default function SpatialHeader({ currentSection, action }: SpatialHeaderProps) {
  const { data: session } = useSession();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between pointer-events-none select-none"
    >
      {/* Left Spatial Brand Pill */}
      <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-slate-700/60 shadow-xl shadow-black/60 before:absolute before:inset-x-4 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-blue-400/30 before:to-transparent">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30 border border-blue-400/20 group-hover:scale-105 transition-transform">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100 tracking-tight">
                LegalMetrics
              </span>
              <Badge variant="default" className="text-[10px] font-mono px-1.5 py-0">
                v2.0
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              PCR 2011 Enforcement
            </p>
          </div>
        </Link>

        {currentSection && (
          <div className="flex items-center gap-2 pl-3 ml-2 border-l border-slate-800">
            <span className="text-slate-600 text-xs font-mono">/</span>
            <span className="text-xs font-medium text-blue-400 font-mono tracking-wide">
              {currentSection}
            </span>
          </div>
        )}
      </div>

      {/* Right Spatial Controls */}
      <div className="pointer-events-auto flex items-center gap-3">
        {/* Gemini Vision Engine Heartbeat Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-slate-700/60 shadow-lg text-[11px] font-mono text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">Gemini Engine:</span>
          <span className="text-emerald-400 font-semibold">Online</span>
        </div>

        {/* Custom page-specific action if passed */}
        {action}

        {/* Fast Scan CTA */}
        <Link href="/scan" className="hidden md:block">
          <Button size="sm" className="gap-2 shadow-lg shadow-blue-600/20">
            <ScanSearch className="w-4 h-4 text-blue-200" />
            <span>Launch Scanner</span>
          </Button>
        </Link>

        {/* Inspector Profile Chip */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-slate-700/60 shadow-lg">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 p-[1px]">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
              <span className="text-[11px] font-bold text-blue-300">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "O"}
              </span>
            </div>
          </div>
          <span className="hidden lg:block text-xs font-medium text-slate-200 pr-1 max-w-[120px] truncate">
            {session?.user?.name || "Official Metrologist"}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
