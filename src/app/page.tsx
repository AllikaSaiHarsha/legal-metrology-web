"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  ClipboardList,
  ScanSearch,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { KPICard } from "@/components/KPICard";
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
  getDynamicDashboardStats,
  subscribeStore,
  hydrateStoreFromDB,
} from "@/lib/inspectionsStore";

const PIE_COLORS = ["#2563eb", "#06b6d4", "#f59e0b", "#22c55e", "#8b5cf6", "#ec4899"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 p-3.5 rounded-xl shadow-2xl shadow-black/80 min-w-[160px]">
        {label && (
          <p className="text-slate-200 text-xs font-semibold mb-2 font-mono pb-1.5 border-b border-slate-800">
            {label}
          </p>
        )}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3 text-xs mt-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color || entry.payload.fill }}
              />
              <span className="text-slate-400 capitalize">{entry.name}:</span>
            </div>
            <span className="text-slate-100 font-bold font-mono">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    hydrateStoreFromDB();
    setDashboardData(getDynamicDashboardStats());
    const unsubscribe = subscribeStore(() => {
      setDashboardData(getDynamicDashboardStats());
    });
    return unsubscribe;
  }, []);

  if (!mounted || !dashboardData) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 ml-72">
          <TopBar title="Executive Dashboard" subtitle="Loading enforcement metrics..." />
          <div className="p-8">
            <div className="h-32 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  const { kpiStats, recentInspections, violationsByCategory, monthlyTrend } = dashboardData;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar
          title="Executive Dashboard"
          subtitle="Real-time Legal Metrology Rule 6 statutory enforcement"
          action={
            <Link href="/scan">
              <Button size="sm" variant="glass" className="gap-2">
                <ScanSearch className="w-3.5 h-3.5 text-blue-400" />
                <span>New Label Scan</span>
              </Button>
            </Link>
          }
        />

        <div className="p-8 space-y-6 max-w-7xl">
          {/* Quick Action Hero Card (Spatial Liquid Glass) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-2xl liquid-glass-card p-6 border border-blue-500/25 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-900/40"
          >
            {/* Ambient Specular Light */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/[0.08] rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-[10px]">
                    <Sparkles className="w-3 h-3 text-blue-400 mr-1 inline" />
                    Gemini Vision 2.5 Flash Pipeline
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    Statutory Rule 6 (PCR 2011)
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-100">
                  Ready to audit a packaged commodity label?
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Upload high-res package packaging images for automated detection of mandatory statutory declarations:
                  Net Quantity, Maximum Retail Price (MRP), Manufacturer/Packer Identity, Month/Year of Manufacture, and Consumer Care details.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/scan">
                  <Button variant="default" size="lg" className="shadow-blue-600/30">
                    <ScanSearch className="w-4 h-4 mr-1.5" />
                    <span>Launch Live Scanner</span>
                    <ArrowUpRight className="w-4 h-4 ml-1 opacity-70" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* KPI Gauges Grid (Bento) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KPICard
              title="Total Inspections"
              value={kpiStats.totalInspections}
              trend={kpiStats.trend.totalInspections}
              trendLabel="vs last month"
              icon={<ClipboardCheck className="w-5 h-5" />}
              accentColor="cobalt"
              progressPercent={82}
              delay={0.05}
            />
            <KPICard
              title="Compliance Rate"
              value={kpiStats.complianceRate}
              suffix="%"
              decimals={1}
              trend={kpiStats.trend.complianceRate}
              trendLabel="vs target (85%)"
              icon={<ShieldCheck className="w-5 h-5" />}
              accentColor="emerald"
              progressPercent={kpiStats.complianceRate}
              delay={0.1}
            />
            <KPICard
              title="Active Violations"
              value={kpiStats.activeViolations}
              trend={kpiStats.trend.activeViolations}
              trendLabel="unresolved flags"
              icon={<AlertTriangle className="w-5 h-5" />}
              accentColor="rose"
              progressPercent={Math.min(100, kpiStats.activeViolations * 12)}
              delay={0.15}
            />
            <KPICard
              title="Pending Audits"
              value={kpiStats.pendingAudits}
              trend={kpiStats.trend.pendingAudits}
              trendLabel="in inspector queue"
              icon={<Clock className="w-5 h-5" />}
              accentColor="amber"
              progressPercent={Math.min(100, kpiStats.pendingAudits * 18)}
              delay={0.2}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Inspection Trends (BKLIT styled Area Chart) */}
            <BentoCard
              title="Inspection Trends & Statutory Adherence"
              subtitle="6-Month historical volume & discrepancy tracking"
              icon={<BarChart3 className="w-4 h-4" />}
              className="lg:col-span-3"
              delay={0.25}
              action={
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-sm" />
                    <span className="text-slate-300">Audits</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-sm" />
                    <span className="text-slate-300">Violations</span>
                  </div>
                </div>
              }
            >
              <div className="h-[290px] w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyTrend}
                    margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCobalt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorRose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148, 163, 184, 0.08)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "rgba(148, 163, 184, 0.2)", strokeDasharray: "4 4" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="inspections"
                      name="Inspections"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCobalt)"
                    />
                    <Area
                      type="monotone"
                      dataKey="violations"
                      name="Violations"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRose)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </BentoCard>

            {/* Violation Types Donut Chart */}
            <BentoCard
              title="Violation Categorization"
              subtitle="Distribution by statutory clause"
              icon={<PieChartIcon className="w-4 h-4" />}
              className="lg:col-span-1 flex flex-col"
              delay={0.3}
            >
              <div className="h-[180px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={violationsByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="category"
                    >
                      {violationsByCategory.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                          stroke="rgba(15, 23, 42, 0.6)"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-2">
                {violationsByCategory.map((entry: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-slate-300 truncate" title={entry.category}>
                        {entry.category}
                      </span>
                    </div>
                    <span className="text-slate-100 font-mono font-semibold ml-2">
                      {entry.count}
                    </span>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>

          {/* Recent Inspections Table */}
          <BentoCard
            title="Recent Inspection Audits"
            subtitle="Verified statutory inspections across regional jurisdictions"
            icon={<ClipboardList className="w-4 h-4" />}
            className="w-full"
            delay={0.35}
            action={
              <Link href="/inspections">
                <Button variant="ghost" size="sm" className="text-xs text-blue-400 gap-1">
                  View Full Registry
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            }
          >
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Audit ID</TableHead>
                    <TableHead>Packaged Commodity</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Compliance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInspections.map((inspection: any) => {
                    const isPass = inspection.complianceScore >= 85;
                    const isWarning = inspection.complianceScore >= 70 && inspection.complianceScore < 85;
                    return (
                      <TableRow key={inspection.id}>
                        <TableCell>
                          <Link
                            href={`/inspection/${inspection.id}`}
                            className="font-mono text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 group"
                          >
                            <span>{inspection.id}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium text-slate-100">
                          {inspection.product}
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {inspection.inspector}
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {inspection.location}
                        </TableCell>
                        <TableCell className="text-slate-400 font-mono text-xs">
                          {inspection.date}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              inspection.status === "completed"
                                ? "success"
                                : inspection.status === "in-progress"
                                ? "warning"
                                : "default"
                            }
                          >
                            {inspection.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${
                                  isPass
                                    ? "bg-emerald-500"
                                    : isWarning
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${inspection.complianceScore}%` }}
                              />
                            </div>
                            <span
                              className={`font-mono font-semibold text-xs ${
                                isPass
                                  ? "text-emerald-400"
                                  : isWarning
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {inspection.complianceScore}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </BentoCard>
        </div>
      </main>
    </div>
  );
}