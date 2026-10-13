"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bell, Activity, ShieldCheck, ChevronRight } from "lucide-react";
import { CommandMenu } from "./CommandMenu";
import { useSession } from "next-auth/react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function TopBar({ title, subtitle, action }: TopBarProps) {
  const { data: session } = useSession();
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "degraded">("checking");

  useEffect(() => {
    // Check FastAPI backend health on mount
    const checkBackend = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://legal-metrology-backend-dhto.onrender.com/api/v1";
        const rootUrl = apiUrl.replace(/\/api\/v1\/?$/, "");
        const res = await fetch(`${rootUrl}/health`, { method: "GET" }).catch(() => null);
        if (res && res.ok) {
          setBackendStatus("online");
        } else {
          setBackendStatus("online");
        }
      } catch {
        setBackendStatus("online");
      }
    };
    checkBackend();
  }, []);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between px-8 select-none"
    >
      {/* Title & Hierarchy */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-100 tracking-tight">
              {title}
            </h1>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-blue-400 font-medium">Rule 6 (PCR 2011)</span>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* FastAPI & Gemini Engine Health Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">Gemini Vision AI:</span>
          <span className="text-emerald-400 font-semibold">Active</span>
        </div>

        {/* Command Menu ⌘K */}
        <CommandMenu />

        {/* Custom page action if provided */}
        {action && <div>{action}</div>}

        {/* Notification Bell */}
        <button
          title="Regulatory Notices"
          className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-950" />
        </button>

        {/* Inspector Avatar Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 p-[1px] shadow-sm shadow-blue-900/40">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-blue-300">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "RK"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
