"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  ScanSearch,
  ClipboardCheck,
  Package,
  AlertTriangle,
  BarChart3,
  Settings,
  Users,
} from "lucide-react";
import { CommandMenu } from "./CommandMenu";

interface DockItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: string;
}

const dockItems: DockItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Studio Scanner", href: "/scan", icon: ScanSearch, highlight: true, badge: "AI" },
  { name: "Inspections", href: "/inspections", icon: ClipboardCheck },
  { name: "Products", href: "/products", icon: Package },
  { name: "Violations", href: "/violations", icon: AlertTriangle },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Team", href: "/team", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function FloatingDock() {
  const pathname = usePathname();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4 select-none">
      <motion.nav
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="pointer-events-auto relative flex items-center gap-1.5 p-2 rounded-2xl bg-slate-950/75 backdrop-blur-2xl border border-slate-700/60 shadow-2xl shadow-black/90 before:absolute before:inset-x-6 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-blue-400/50 before:to-transparent"
      >
        {/* Glow halo behind dock */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-500/10 to-blue-600/20 rounded-2xl blur-lg -z-10 pointer-events-none" />

        {dockItems.map((item, idx) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isHovered = hoveredIdx === idx;

          return (
            <Link
              key={item.name}
              href={item.href}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="relative group p-2.5 rounded-xl transition-colors duration-200 flex flex-col items-center justify-center outline-none"
            >
              {/* Active Tab Spring Pill */}
              {isActive && (
                <motion.div
                  layoutId="activeDockPill"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  className="absolute inset-0 bg-blue-600/20 border border-blue-500/50 rounded-xl -z-10 shadow-lg shadow-blue-600/30"
                />
              )}

              {/* Hover highlight background */}
              {!isActive && isHovered && (
                <motion.div
                  layoutId="hoverDockPill"
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-slate-800/60 rounded-xl -z-10"
                />
              )}

              {/* Icon with Highlight/Pulse for Scanner */}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? "text-blue-400 scale-105"
                      : isHovered
                      ? "text-slate-100 scale-110"
                      : "text-slate-400"
                  } ${item.highlight && !isActive ? "text-cyan-400" : ""}`}
                />

                {item.highlight && (
                  <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </div>

              {/* Active Dot indicator below icon */}
              {isActive && (
                <motion.span
                  layoutId="activeDockDot"
                  className="w-1.5 h-1.5 mt-1 rounded-full bg-blue-400 shadow-sm shadow-blue-400"
                />
              )}

              {/* Floating Tooltip Pill */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.92 }}
                    animate={{ opacity: 1, y: -40, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute pointer-events-none px-2.5 py-1 rounded-lg bg-slate-900/95 border border-slate-700/80 shadow-xl text-[11px] font-medium text-slate-100 whitespace-nowrap z-50 flex items-center gap-1.5 backdrop-blur-md"
                  >
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="text-[9px] font-mono font-semibold px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        {/* Vertical Divider */}
        <div className="w-[1px] h-6 bg-slate-800 mx-1" />

        {/* Global Command Menu ⌘K trigger */}
        <div className="pl-1">
          <CommandMenu />
        </div>
      </motion.nav>
    </div>
  );
}
