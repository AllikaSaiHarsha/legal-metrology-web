"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  ScanSearch,
  ClipboardCheck,
  Package,
  AlertTriangle,
  BarChart3,
  Settings,
  Users,
  FileDown,
  X,
  Command,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ActionItem {
  id: string;
  name: string;
  category: "Navigation" | "Actions";
  icon: any;
  href?: string;
  badge?: string;
  action?: () => void;
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const items: ActionItem[] = [
    { id: "dash", name: "Overview Dashboard", category: "Navigation", icon: LayoutDashboard, href: "/" },
    { id: "scan", name: "Live Vision Scanner", category: "Navigation", icon: ScanSearch, href: "/scan", badge: "FASTAPI" },
    { id: "insp", name: "Inspections Registry", category: "Navigation", icon: ClipboardCheck, href: "/inspections" },
    { id: "prod", name: "Packaged Products", category: "Navigation", icon: Package, href: "/products" },
    { id: "viol", name: "Violations Database", category: "Navigation", icon: AlertTriangle, href: "/violations" },
    { id: "rep", name: "Statutory Reports & Certificates", category: "Navigation", icon: BarChart3, href: "/reports" },
    { id: "sett", name: "System Settings", category: "Navigation", icon: Settings, href: "/settings" },
    { id: "team", name: "Inspector Team & RBAC", category: "Navigation", icon: Users, href: "/team" },
    {
      id: "act-scan",
      name: "New Rule 6 Label Scan",
      category: "Actions",
      icon: ScanSearch,
      action: () => router.push("/scan"),
    },
    {
      id: "act-report",
      name: "Export Compliance Summary PDF",
      category: "Actions",
      icon: FileDown,
      action: () => router.push("/reports"),
    },
  ];

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (item: ActionItem) => {
    setOpen(false);
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <>
      {/* Trigger pill */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-blue-500/40 text-slate-400 hover:text-slate-200 text-xs transition-all shadow-sm group"
        title="Quick Search (Ctrl+K or ⌘K)"
      >
        <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
        <span className="hidden sm:inline">Search metrology...</span>
        <kbd className="ml-1.5 font-mono text-[10px] bg-slate-800/80 border border-slate-700/80 px-1.5 py-0.5 rounded text-slate-400 font-semibold group-hover:text-slate-300">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/70 shadow-2xl shadow-black/80 overflow-hidden z-10"
            >
              {/* Search input header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
                <Search className="w-5 h-5 text-blue-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Type a command or search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {filtered.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No results found for &ldquo;{search}&rdquo;
                  </div>
                ) : (
                  filtered.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-600/15 hover:text-blue-300 text-slate-300 text-sm transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        {item.badge && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Modal footer */}
              <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Navigate with click or Enter</span>
                <span>ESC to close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CommandMenu;
