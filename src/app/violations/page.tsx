"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import SpatialHeader from "@/components/SpatialHeader";
import FloatingDock from "@/components/FloatingDock";
import { BentoCard } from "@/components/BentoCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Search,
  Activity,
  Package,
  ExternalLink,
  ShieldAlert,
  Flame,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

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
    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredViolations = violations.filter((v) => {
    const matchesSearch =
      v.ruleTitle.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase()) ||
      v.inspection?.product?.name.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity =
      filterSeverity === "all" || v.severity.toLowerCase() === filterSeverity.toLowerCase();

    return matchesSearch && matchesSeverity;
  });

  const highCount = violations.filter((v) => v.severity.toLowerCase() === "high").length;
  const medCount = violations.filter((v) => v.severity.toLowerCase() === "medium").length;
  const lowCount = violations.filter((v) => v.severity.toLowerCase() === "low").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      <SpatialHeader />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Violations &amp; Infractions Database
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Non-compliance offenses and statutory infractions recorded under Packaged Commodities Rules, 2011
            </p>
          </div>
          <Link href="/scan">
            <Button size="sm" variant="default" className="shadow-blue-600/30 gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Audit New Sample</span>
            </Button>
          </Link>
        </div>
          {/* Top Severity Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <BentoCard delay={0.05} glowColor="rgba(239, 68, 68, 0.2)">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Total Infractions
                  </p>
                  <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">
                    {violations.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.1} glowColor="rgba(239, 68, 68, 0.25)">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    High Severity
                  </p>
                  <p className="text-2xl font-bold text-red-400 mt-1 font-mono">{highCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Flame className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.15} glowColor="rgba(234, 179, 8, 0.2)">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Medium Severity
                  </p>
                  <p className="text-2xl font-bold text-yellow-400 mt-1 font-mono">{medCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center text-yellow-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.2} glowColor="rgba(37, 99, 235, 0.2)">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Minor / Technical
                  </p>
                  <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">{lowCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>
          </div>

          {/* Search & Severity Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl liquid-glass-card">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search violations, rule codes, or commodity name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/70 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={filterSeverity === "all" ? "default" : "secondary"}
                size="sm"
                onClick={() => setFilterSeverity("all")}
                className="text-xs"
              >
                All
              </Button>
              <Button
                variant={filterSeverity === "high" ? "destructive" : "secondary"}
                size="sm"
                onClick={() => setFilterSeverity("high")}
                className="text-xs"
              >
                High
              </Button>
              <Button
                variant={filterSeverity === "medium" ? "warning" : "secondary"}
                size="sm"
                onClick={() => setFilterSeverity("medium")}
                className="text-xs"
              >
                Medium
              </Button>
              <Button
                variant={filterSeverity === "low" ? "default" : "secondary"}
                size="sm"
                onClick={() => setFilterSeverity("low")}
                className="text-xs"
              >
                Low
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl liquid-glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Statutory Infraction</TableHead>
                  <TableHead>Packaged Commodity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Logged Date</TableHead>
                  <TableHead className="text-right">Inspection Link</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      Loading statutory violations...
                    </TableCell>
                  </TableRow>
                ) : filteredViolations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                      No violations found matching the specified criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredViolations.map((v) => {
                    const sev = v.severity.toLowerCase();
                    const badgeVariant =
                      sev === "high" ? "destructive" : sev === "medium" ? "warning" : "default";

                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          <Badge variant={badgeVariant} className="uppercase text-[10px]">
                            {v.severity}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <p className="font-semibold text-xs text-slate-100">{v.ruleTitle}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {v.description}
                          </p>
                        </TableCell>

                        <TableCell className="text-xs text-slate-200 font-medium">
                          {v.inspection?.product?.name || "Packaged Commodity"}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {v.status || "Active"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-slate-400 font-mono text-xs">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </TableCell>

                        <TableCell className="text-right">
                          {v.inspection?.id ? (
                            <Link href={`/inspection/${v.inspection.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-blue-400 hover:text-blue-300 gap-1"
                              >
                                <span>Audit {v.inspection.id.slice(0, 8)}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
      </main>
      <FloatingDock />
    </div>
  );
}
