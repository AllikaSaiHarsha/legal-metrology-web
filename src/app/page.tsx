"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { animate } from "animejs";
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
  Scale,
  ShieldCheck,
  AlertTriangle,
  Clock,
  BarChart3,
  ClipboardList,
  ScanSearch,
  ArrowUpRight,
  Sparkles,
  FileDown,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Eye,
} from "lucide-react";

import SpatialHeader from "@/components/SpatialHeader";
import FloatingDock from "@/components/FloatingDock";
import { BentoCard } from "@/components/BentoCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getDynamicDashboardStats,
  subscribeStore,
  hydrateStoreFromDB,
} from "@/lib/inspectionsStore";
import { generateInspectionPDF } from "@/lib/pdfGenerator";

const PIE_COLORS = ["#2563eb", "#06b6d4", "#f59e0b", "#22c55e", "#8b5cf6", "#ec4899"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-xl shadow-2xl min-w-[150px]">
        {label && (
          <p className="text-slate-300 text-xs font-semibold mb-1.5 font-mono pb-1 border-b border-slate-800">
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
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const gaugeRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    setMounted(true);
    hydrateStoreFromDB();
    const data = getDynamicDashboardStats();
    setDashboardData(data);
    if (data?.recentInspections?.length > 0) {
      setSelectedInspection(data.recentInspections[0]);
    }

    const unsubscribe = subscribeStore(() => {
      const updated = getDynamicDashboardStats();
      setDashboardData(updated);
      if (updated?.recentInspections?.length > 0) {
        setSelectedInspection(updated.recentInspections[0]);
      }
    });
    return unsubscribe;
  }, []);

  // Animate Anime.js circular gauge
  useEffect(() => {
    if (!mounted || !gaugeRef.current || !dashboardData) return;
    const rate = dashboardData.kpiStats?.complianceRate || 89;
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    const targetOffset = circumference - (rate / 100) * circumference;

    gaugeRef.current.style.strokeDasharray = `${circumference}`;
    gaugeRef.current.style.strokeDashoffset = `${circumference}`;

    animate(gaugeRef.current, {
      strokeDashoffset: [circumference, targetOffset],
      duration: 1600,
      easing: "easeOutCubic",
    });
  }, [mounted, dashboardData]);

  if (!mounted || !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
            <Scale className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-xs font-mono text-slate-400">Loading Spatial Command Center...</p>
        </div>
      </div>
    );
  }

  const { kpiStats, recentInspections, violationsByCategory, monthlyTrend } = dashboardData;
  const complianceRate = kpiStats.complianceRate || 89.2;

  const handleDownloadSelectedCert = () => {
    if (!selectedInspection) return;
    generateInspectionPDF({
      inspection: {
        id: selectedInspection.id,
        productId: "PROD-GEN",
        inspector: selectedInspection.inspector,
        location: selectedInspection.location,
        date: selectedInspection.date,
        status: selectedInspection.status,
        complianceScore: selectedInspection.complianceScore,
        findings: ["Statutory PCR 2011 Rule 6 Verified"],
        imageUrl: "",
      },
      product: {
        id: "PROD-GEN",
        name: selectedInspection.product,
        category: "Packaged Commodity",
        manufacturer: "Certified Packager",
        mfgDate: selectedInspection.date,
        expiryDate: "Per Label",
        batchNo: "BATCH-AI-VERIFIED",
        netQuantity: "Declared",
        mrp: 150,
        complianceStatus: selectedInspection.complianceScore >= 85 ? "compliant" : "non-compliant",
      },
      violations: [],
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative selection:bg-blue-600 selection:text-white">
      {/* Background Ambient Mesh Orbs */}
      <div className="fixed top-[-10%] left-[15%] w-[650px] h-[650px] bg-blue-600/[0.08] rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[10%] right-[10%] w-[500px] h-[500px] bg-cyan-500/[0.05] rounded-full blur-[130px] pointer-events-none" />

      {/* Floating Spatial Header */}
      <SpatialHeader currentSection="Overview" />

      {/* Main Edge-to-Edge Spatial Canvas */}
      <main className="max-w-[1600px] mx-auto px-6 pt-2 pb-32 space-y-6">
        {/* ROW 1: Asymmetrical Hero Bento (Span 7 + Span 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* TILE 1: Spatial Overview & Anime.js Circular Gauge (Span 7) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-7 rounded-3xl liquid-glass-card p-7 border border-slate-700/60 shadow-2xl relative overflow-hidden flex flex-col justify-between"
          >
            {/* Top Bar inside card */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100 tracking-tight uppercase">
                    Spatial Compliance Radar
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Statutory Rule 6 (PCR 2011) Adherence
                  </p>
                </div>
              </div>
              <Badge variant="success" className="text-[10px] font-mono">
                System Nominal
              </Badge>
            </div>

            {/* Gauge + Metrics Center Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 items-center">
              {/* Radial Anime.js Gauge */}
              <div className="md:col-span-5 flex flex-col items-center justify-center relative">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                    {/* Background track */}
                    <circle
                      cx="80"
                      cy="80"
                      r="64"
                      className="stroke-slate-800/80"
                      strokeWidth="11"
                      fill="transparent"
                    />
                    {/* Animated foreground stroke */}
                    <circle
                      ref={gaugeRef}
                      cx="80"
                      cy="80"
                      r="64"
                      stroke="url(#blueCyanGrad)"
                      strokeWidth="11"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    <defs>
                      <linearGradient id="blueCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Centered Stat */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-slate-100 tracking-tight font-mono">
                      {complianceRate}%
                    </span>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                      Overall Compliance
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                  <span>Target: 85%</span>
                  <span className="text-emerald-400 font-semibold">+4.2% vs Q3</span>
                </div>
              </div>

              {/* Statutory Adherence Breakdown & Mini Area Sparkline */}
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">Rule 6(1)(a) MRP Declaration</span>
                      <span className="text-blue-400 font-bold">96%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[96%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">Rule 6(1)(b) Net Quantity Exactitude</span>
                      <span className="text-cyan-400 font-bold">98%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full w-[98%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">Rule 6(1)(d) Date Marking (Mfg/Pack)</span>
                      <span className="text-yellow-400 font-bold">81%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full w-[81%]" />
                    </div>
                  </div>
                </div>

                {/* 7-Day Sparkline */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      7-Day Inspection Volume
                    </span>
                    <span className="text-[11px] font-mono text-blue-400">
                      {kpiStats.totalInspections} audits logged
                    </span>
                  </div>
                  <div className="h-14 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrend} margin={{ top: 2, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="inspections"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#sparkGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* TILE 2: Live Metrics & Velocity HUD (Span 5) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="lg:col-span-5 rounded-3xl liquid-glass-card p-7 border border-slate-700/60 shadow-2xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <h2 className="text-sm font-bold text-slate-100 tracking-tight uppercase flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Live Enforcement Telemetry
              </h2>
              <span className="text-[11px] font-mono text-slate-400">Real-time sync</span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-5">
              {/* Metric 1 */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Total Audits
                  </span>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold font-mono text-slate-100">
                    {kpiStats.totalInspections}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Automated Vision checks</p>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Compliant Packs
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {Math.round((kpiStats.totalInspections * (complianceRate / 100)))}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Certificates cleared</p>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Active Violations
                  </span>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold font-mono text-red-400">
                    {kpiStats.activeViolations}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pending legal remedies</p>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Pending Queue
                  </span>
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold font-mono text-yellow-400">
                    {kpiStats.pendingAudits}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Awaiting verification</p>
                </div>
              </div>
            </div>

            {/* Launch Scanner Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 to-slate-900 border border-blue-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Gemini Optical Scanner
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Drop any commodity label for automated Rule 6 verification
                </p>
              </div>
              <Link href="/scan">
                <Button size="sm" className="gap-1 shadow-lg shadow-blue-600/30">
                  <span>Open Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ROW 2: 3-Column Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* TILE 3: PCR Rule 6 Violation Matrix & Donut (Span 4) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            className="lg:col-span-4 rounded-3xl liquid-glass-card p-6 border border-slate-700/60 shadow-2xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                Rule 6 Infraction Matrix
              </h3>
              <span className="text-[10px] font-mono text-slate-400">PCR 2011</span>
            </div>

            <div className="h-44 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={violationsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={74}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="category"
                  >
                    {violationsByCategory.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        stroke="rgba(15, 23, 42, 0.8)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              {violationsByCategory.slice(0, 4).map((entry: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-slate-300 truncate text-[11px]">{entry.category}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-100 text-[11px]">
                    {entry.count} flags
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* TILE 4: Live Statutory Enforcement Log / Recent Actions Stream (Span 4) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16 }}
            className="lg:col-span-4 rounded-3xl liquid-glass-card p-6 border border-slate-700/60 shadow-2xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                Statutory Audit Stream
              </h3>
              <Link href="/inspections" className="text-[10px] text-blue-400 hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-2.5 my-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
              {recentInspections.map((item: any) => {
                const isSelected = selectedInspection?.id === item.id;
                const isPass = item.complianceScore >= 85;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedInspection(item)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-blue-600/15 border-blue-500/50 shadow-md shadow-blue-900/30"
                        : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold text-blue-400">
                          {item.id}
                        </span>
                        <span className="text-slate-500 text-[10px]">•</span>
                        <span className="text-slate-400 text-[10px] font-mono">{item.date}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-100 truncate mt-0.5">
                        {item.product}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{item.location}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono font-bold text-xs ${
                          isPass ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {item.complianceScore}%
                      </span>
                      <div className="mt-1">
                        <Badge
                          variant={
                            item.status === "completed"
                              ? "success"
                              : item.status === "in-progress"
                              ? "warning"
                              : "default"
                          }
                          className="text-[9px] px-1.5 py-0"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Click any record to inspect</span>
              <span className="font-mono text-blue-400">{recentInspections.length} recorded</span>
            </div>
          </motion.div>

          {/* TILE 5: STUDIO INSPECTION CANVAS DRAWER / QUICK INSPECTOR (Span 4) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="lg:col-span-4 rounded-3xl liquid-glass-card p-6 border border-blue-500/40 shadow-2xl relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-blue-950/20 via-slate-900/60 to-slate-900/80"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Studio Inspector Canvas
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-blue-300">
                Live Audit
              </Badge>
            </div>

            {/* Interactive Package Card with Bounding Box Tags */}
            <div className="my-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col items-center justify-center relative min-h-[190px]">
              {/* Product Info Chip */}
              <div className="w-full mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {selectedInspection?.product || "Eco-Fresh Commodity Pack"}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedInspection?.id || "INS-001"}
                </span>
              </div>

              {/* Package Illustration with Bounding Box Chips */}
              <div className="w-full space-y-2">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-blue-300">
                    Rule 6(1)(a) MRP
                  </span>
                  <Badge variant="success" className="text-[9px] py-0">
                    ₹ 150.00 (Pass)
                  </Badge>
                </div>

                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-cyan-300">
                    Rule 6(1)(b) Net Qty
                  </span>
                  <Badge variant="success" className="text-[9px] py-0">
                    500 g (Pass)
                  </Badge>
                </div>

                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-emerald-300">
                    Rule 6(1)(d) Mfg Date
                  </span>
                  <Badge variant="success" className="text-[9px] py-0">
                    Verified
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions: Approve & One-Click PDF Export */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadSelectedCert}
                className="w-full gap-2 shadow-lg shadow-blue-600/30"
              >
                <FileDown className="w-4 h-4 text-white" />
                <span>Export Compliance Certificate</span>
              </Button>

              <Link
                href={selectedInspection ? `/inspection/${selectedInspection.id}` : "/scan"}
                className="block w-full"
              >
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Open Full Optical Workbench</span>
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Floating Liquid Glass Navigation Dock (Bottom) */}
      <FloatingDock />
    </div>
  );
}