"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Live Scanner", href: "/scan", icon: ScanSearch, badge: "FASTAPI" },
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
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 w-72 h-screen bg-zinc-950 border-r border-white/[0.06] flex flex-col z-50">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.02] to-transparent pointer-events-none" />

      {/* Brand */}
      <div className="relative p-6 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            LegalMetrics
          </h1>
          <p className="text-zinc-500 text-xs tracking-widest uppercase mt-0.5 font-medium">
            Compliance Platform
          </p>
        </div>
      </div>

      {/* Navigation */}
      <motion.nav
        className="flex-1 overflow-y-auto py-6 px-4 space-y-8 relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <motion.div key={item.name} variants={itemVariants}>
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full"
                    />
                  )}
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm flex-1">{item.name}</span>
                  {"badge" in item && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="space-y-3">
          <motion.h3 variants={itemVariants} className="px-4 text-xs font-semibold text-zinc-600 tracking-widest uppercase">
            Management
          </motion.h3>
          <div className="space-y-1">
            {managementItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <motion.div key={item.name} variants={itemVariants}>
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full"
                      />
                    )}
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/[0.06] relative">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.02] transition-colors group">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-sm font-semibold text-zinc-300">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "RK"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">
              {session?.user?.name || "Loading..."}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {(session?.user as any)?.role || "Senior Inspector"}
            </p>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Secure Logout"
            className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
