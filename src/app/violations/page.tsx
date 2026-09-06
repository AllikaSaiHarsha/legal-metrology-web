"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { AlertTriangle, Search, Activity, Package, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Violation {
  id: string;
  ruleTitle: string;
  severity: "high" | "medium" | "low";
  description: string;
  status: string;
  createdAt: string;
  inspection: {
    id: string;
    product: {
      name: string;
    };
  };
}

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");

  useEffect(() => {
    let isCancelled = false;
    const fetchViolations = async () => {
      try {
        const res = await fetch("/api/db/violations");
        if (!res.ok) {
          throw new Error("Failed to fetch violations");
        }
        const data = await res.json();
        if (!isCancelled) {
          setViolations(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };
    fetchViolations();
    return () => { isCancelled = true; };
  }, []);

  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20";
    }
  };

  const filteredViolations = violations.filter(v => {
    const matchesSearch = v.ruleTitle.toLowerCase().includes(search.toLowerCase()) || 
                          v.description.toLowerCase().includes(search.toLowerCase()) ||
                          v.inspection?.product?.name.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || v.severity.toLowerCase() === filterSeverity.toLowerCase();
    
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar title="Violations Database" subtitle="All recorded offenses across inspections" />
        
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Detected Violations</h2>
              <p className="text-zinc-400 mt-1">Detailed list of non-compliant items</p>
            </div>
            
            <div className="flex items-center gap-3">
              <select 
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-zinc-900/50 border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
              >
                <option value="all">All Severities</option>
                <option value="high">High Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="low">Low Severity</option>
              </select>

              <div className="relative">
                <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search violations..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-zinc-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 w-64"
                />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-zinc-900/40">
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Severity</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Rule Broken</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Product</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        Loading violations...
                      </td>
                    </tr>
                  ) : filteredViolations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        No violations found.
                      </td>
                    </tr>
                  ) : (
                    filteredViolations.map((v) => (
                      <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getSeverityStyle(v.severity)}`}>
                            {v.severity}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-white">{v.ruleTitle}</div>
                          <div className="text-xs text-zinc-500 mt-1 max-w-xs truncate" title={v.description}>{v.description}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-sm text-zinc-300">
                            <Package className="w-4 h-4 text-zinc-500" />
                            <span className="truncate max-w-[150px]">{v.inspection?.product?.name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm text-zinc-300 capitalize">{v.status || "Pending"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-400">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link 
                            href={`/inspection/${v.inspection?.id}`}
                            className="inline-flex items-center justify-center p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="View Inspection"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
