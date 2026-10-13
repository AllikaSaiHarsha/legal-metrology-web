"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Scale,
  LayoutDashboard,
  ScanSearch,
  ClipboardCheck,
  Package,
  AlertTriangle,
  BarChart3,
  Settings,
  Users,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Live Scanner", href: "/scan", icon: ScanSearch, badge: "FASTAPI" },
  { name: "Pre-Market Audit", href: "/pre-market", icon: ShieldCheck, badge: "B2B" },
  { name: "Inspections", href: "/inspections", icon: ClipboardCheck },
  { name: "Products", href: "/products", icon: Package },
  { name: "Violations", href: "/violations", icon: AlertTriangle },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

const managementItems = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Team", href: "/team", icon: Users },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { x: -12, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.25 } },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 w-72 h-screen bg-slate-950/95 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col z-50 select-none shadow-2xl shadow-black/60">
      {/* Specular Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/[0.04] via-transparent to-transparent pointer-events-none" />

      {/* Brand Header */}
      <div className="relative p-5 border-b border-slate-800/80 flex items-center gap-3.5">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30 border border-blue-400/20">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base text-slate-100 tracking-tight">
              LegalMetrics
            </h1>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
              v2.0
            </span>
          </div>
          <p className="text-slate-400 text-xs tracking-wider uppercase mt-0.5 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-400 inline" />
            Compliance Suite
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <motion.nav
        className="flex-1 overflow-y-auto py-5 px-3.5 space-y-6 relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-1">
          <p className="px-3 mb-2 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
            Core Modules
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <motion.div key={item.name} variants={itemVariants}>
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-600/15 text-blue-300 font-semibold border border-blue-500/30 shadow-md shadow-blue-950/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/60 hover:bg-slate-900 border border-transparent"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r-full shadow-lg shadow-blue-500/80"
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span className="text-sm flex-1">{item.name}</span>
                  {"badge" in item && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/35">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="space-y-1">
          <motion.h3
            variants={itemVariants}
            className="px-3 mb-2 text-[11px] font-semibold text-slate-500 tracking-wider uppercase"
          >
            Administration
          </motion.h3>
          {managementItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <motion.div key={item.name} variants={itemVariants}>
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-600/15 text-blue-300 font-semibold border border-blue-500/30 shadow-md shadow-blue-950/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r-full shadow-lg shadow-blue-500/80"
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span className="text-sm flex-1">{item.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.nav>

      {/* User Profile Footer */}
      <div className="p-3.5 border-t border-slate-800/80 relative bg-slate-950/60">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-900 transition-colors group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center text-xs font-semibold text-blue-300 shadow-sm">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "RK"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {session?.user?.name || "Officer in Charge"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {(session?.user as any)?.role || "Senior Metrologist"}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Secure Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
