"use client";

import { motion } from "framer-motion";
import { Search, Bell } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 h-16 bg-zinc-900/60 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-8"
    >
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
        {subtitle && (
          <p className="text-sm text-zinc-500">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search inspections..."
            className="w-64 pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all duration-300"
          />
        </div>

        <button className="relative p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-zinc-900" />
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[1px] cursor-pointer shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-shadow">
          <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-zinc-200">RK</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
