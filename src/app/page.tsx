"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Cell
} from "recharts";
import {
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  ClipboardList,
  ScanSearch
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { KPICard } from "@/components/KPICard";
import { BentoCard } from "@/components/BentoCard";
import { getDynamicDashboardStats, subscribeStore, hydrateStoreFromDB } from "@/lib/inspectionsStore";

const PIE_COLORS = ['#818cf8', '#fb7185', '#fbbf24', '#34d399', '#a78bfa', '#38bdf8'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-md border border-white/[0.08] p-4 rounded-xl shadow-xl shadow-black/40">
        {label && <p className="text-zinc-200 font-medium mb-2">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill }} />
            <span className="text-zinc-400">{entry.name}:</span>
            <span className="text-zinc-100 font-medium">{entry.value}</span>
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
    // Return a skeleton or just the layout without data to match SSR
    return (
      <div className="flex min-h-screen bg-zinc-950">
        <Sidebar />
        <main className="flex-1 ml-72">
          <TopBar title="Live Enforcement Dashboard" subtitle="Overview" />
        </main>
      </div>
    );
  }

  const { kpiStats, recentInspections, violationsByCategory, monthlyTrend } = dashboardData;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar title="Executive Dashboard" subtitle="Real-time compliance overview" />
        <div className="p-8 space-y-6">
          {/* Quick Action Banner */}
          <div className="flex items-center justify-between p-4 px-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ScanSearch className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Ready to inspect a new product label?
                </h2>
                <p className="text-xs text-zinc-400">
                  Upload package photos to the FastAPI OCR backend for automated Legal Metrology Rule 2011 compliance checks.
                </p>
              </div>
            </div>
            <Link
              href="/scan"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ScanSearch className="w-4 h-4" />
              <span>Launch Live Scanner</span>
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {/* KPI Cards */}
            <KPICard
              title="Total Inspections"
              value={kpiStats.totalInspections}
              trend={kpiStats.trend.totalInspections}
              trendLabel="vs last month"
              icon={<ClipboardCheck className="w-5 h-5" />}
              accentColor="indigo"
              delay={0.1}
            />
            <KPICard
              title="Compliance Rate"
              value={kpiStats.complianceRate}
              suffix="%"
              decimals={1}
              trend={kpiStats.trend.complianceRate}
              trendLabel="vs last month"
              icon={<ShieldCheck className="w-5 h-5" />}
              accentColor="emerald"
              delay={0.2}
            />
            <KPICard
              title="Active Violations"
              value={kpiStats.activeViolations}
              trend={kpiStats.trend.activeViolations}
              trendLabel="vs last month"
              icon={<AlertTriangle className="w-5 h-5" />}
              accentColor="rose"
              delay={0.3}
            />
            <KPICard
              title="Pending Audits"
              value={kpiStats.pendingAudits}
              trend={kpiStats.trend.pendingAudits}
              trendLabel="vs last month"
              icon={<Clock className="w-5 h-5" />}
              accentColor="amber"
              delay={0.4}
            />

            {/* Charts Row */}
            <BentoCard
              title="Inspection Trends"
              icon={<BarChart3 className="w-5 h-5" />}
              className="col-span-3"
              delay={0.5}
            >
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInspections" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Area type="monotone" dataKey="inspections" name="Inspections" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorInspections)" />
                    <Area type="monotone" dataKey="violations" name="Violations" stroke="#fb7185" strokeWidth={2} fillOpacity={1} fill="url(#colorViolations)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </BentoCard>

            <BentoCard
              title="Violation Types"
              icon={<PieChartIcon className="w-5 h-5" />}
              className="col-span-1 flex flex-col"
              delay={0.6}
            >
              <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={violationsByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="category"
                    >
                      {violationsByCategory.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(255,255,255,0.02)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex-1 overflow-y-auto pr-2 space-y-2">
                {violationsByCategory.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-zinc-400 truncate w-32" title={entry.category}>{entry.category}</span>
                    </div>
                    <span className="text-zinc-200 font-medium">{entry.count}</span>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Table Row */}
            <BentoCard
              title="Recent Inspections"
              icon={<ClipboardList className="w-5 h-5" />}
              className="col-span-4"
              delay={0.7}
            >
              <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.04]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-400 bg-zinc-800/30 uppercase border-b border-white/[0.04]">
                    <tr>
                      <th className="px-6 py-4 font-medium">ID</th>
                      <th className="px-6 py-4 font-medium">Product</th>
                      <th className="px-6 py-4 font-medium">Inspector</th>
                      <th className="px-6 py-4 font-medium">Location</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {recentInspections.map((inspection: any) => (
                      <tr key={inspection.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <Link href={`/inspection/${inspection.id}`} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            {inspection.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-zinc-200">{inspection.product}</td>
                        <td className="px-6 py-4 text-zinc-400">{inspection.inspector}</td>
                        <td className="px-6 py-4 text-zinc-400">{inspection.location}</td>
                        <td className="px-6 py-4 text-zinc-400">{inspection.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${
                            inspection.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            inspection.status === 'in-progress' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {inspection.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${
                            inspection.complianceScore > 90 ? 'text-emerald-400' :
                            inspection.complianceScore > 75 ? 'text-amber-400' :
                            'text-rose-400'
                          }`}>
                            {inspection.complianceScore}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BentoCard>
          </div>
        </div>
      </main>
    </div>
  );
}