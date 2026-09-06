"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  ArrowUpDown,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { BentoCard } from "@/components/BentoCard";
import {
  loadStore,
  subscribeStore,
  Inspection,
  Product,
  Violation,
} from "@/lib/inspectionsStore";
import { generateInspectionPDF } from "@/lib/pdfGenerator";
import { hydrateStoreFromDB } from "@/lib/inspectionsStore";

export default function ReportsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "compliant" | "non-compliant">("all");
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    hydrateStoreFromDB().catch(console.error);
    const data = loadStore();
    setInspections(data.inspections);
    setProducts(data.products);
    setViolations(data.violations);

    const unsubscribe = subscribeStore((updated) => {
      setInspections(updated.inspections);
      setProducts(updated.products);
      setViolations(updated.violations);
    });

    return unsubscribe;
  }, []);

  const handleDownloadPDF = (inspection: Inspection) => {
    setGeneratingId(inspection.id);
    const prod = products.find((p) => p.id === inspection.productId);
    const vios = violations.filter((v) => v.inspectionId === inspection.id);

    setTimeout(() => {
      try {
        generateInspectionPDF({
          inspection,
          product: prod,
          violations: vios,
        });
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Failed to generate PDF report.");
      } finally {
        setGeneratingId(null);
      }
    }, 200);
  };

  const handleDownloadCSV = (inspection: Inspection) => {
    const prod = products.find((p) => p.id === inspection.productId);
    const vios = violations.filter((v) => v.inspectionId === inspection.id);
    
    const headers = ["Inspection ID", "Date", "Product Name", "Manufacturer", "Inspector", "Location", "Overall Compliance", "Rule Breached", "Severity"];
    const rows: string[] = [];
    
    if (vios.length === 0) {
      rows.push([
        inspection.id,
        inspection.date,
        `"${prod?.name || 'N/A'}"`,
        `"${prod?.manufacturer || 'N/A'}"`,
        `"${inspection.inspector}"`,
        `"${inspection.location}"`,
        "COMPLIANT",
        "None",
        "N/A"
      ].join(","));
    } else {
      vios.forEach(v => {
        rows.push([
          inspection.id,
          inspection.date,
          `"${prod?.name || 'N/A'}"`,
          `"${prod?.manufacturer || 'N/A'}"`,
          `"${inspection.inspector}"`,
          `"${inspection.location}"`,
          "NON-COMPLIANT",
          `"${v.ruleTitle}"`,
          v.severity
        ].join(","));
      });
    }

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inspection_report_${inspection.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter inspections
  const filteredInspections = inspections.filter((ins) => {
    const prod = products.find((p) => p.id === ins.productId);
    const prodName = prod?.name || "";
    const isCompliant = !violations.some((v) => v.inspectionId === ins.id);

    const matchesSearch =
      ins.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "compliant" && isCompliant) ||
      (filterStatus === "non-compliant" && !isCompliant);

    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const totalReports = inspections.length;
  const compliantCount = inspections.filter((ins) => {
    return !violations.some((v) => v.inspectionId === ins.id);
  }).length;
  const nonCompliantCount = totalReports - compliantCount;
  const avgScore =
    totalReports > 0
      ? Math.round(
          inspections.reduce((sum, i) => sum + (i.complianceScore || 85), 0) /
            totalReports
        )
      : 85;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar
          title="Compliance Reports & Certificates"
          subtitle="Official Legal Metrology inspection records & PDF generation"
        />

        <div className="p-8 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-6">
            <BentoCard delay={0.05}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 font-medium">
                    Total Certificates
                  </p>
                  <p className="text-2xl font-bold text-zinc-100 mt-1">
                    {totalReports}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.1}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 font-medium">
                    Compliant Cleared
                  </p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {compliantCount}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.15}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 font-medium">
                    Violations Notice
                  </p>
                  <p className="text-2xl font-bold text-rose-400 mt-1">
                    {nonCompliantCount}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.2}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 font-medium">
                    Average Score
                  </p>
                  <p className="text-2xl font-bold text-zinc-100 mt-1">
                    {avgScore}%
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <FileCheck2 className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>
          </div>

          {/* Search, Filter & Action Bar */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] shadow-xl">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by product, inspector, ID, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  filterStatus === "all"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                All Reports
              </button>
              <button
                onClick={() => setFilterStatus("compliant")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  filterStatus === "compliant"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                Compliant
              </button>
              <button
                onClick={() => setFilterStatus("non-compliant")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  filterStatus === "non-compliant"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                Violations
              </button>

              <div className="w-px h-5 bg-white/[0.08] mx-1" />

              <Link
                href="/scan"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Inspection</span>
              </Link>
            </div>
          </div>

          {/* Reports Table */}
          <div className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800/40 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-white/[0.06]">
                  <tr>
                    <th className="py-3.5 px-6 font-medium">Certificate Ref / ID</th>
                    <th className="py-3.5 px-6 font-medium">Commodity & Brand</th>
                    <th className="py-3.5 px-6 font-medium">Enforcement Officer</th>
                    <th className="py-3.5 px-6 font-medium">Audit Date</th>
                    <th className="py-3.5 px-6 font-medium">Statutory Status</th>
                    <th className="py-3.5 px-6 font-medium">Score</th>
                    <th className="py-3.5 px-6 font-medium text-right">Official Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.04]">
                  {filteredInspections.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500">
                        No inspection reports match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInspections.map((inspection) => {
                      const prod = products.find((p) => p.id === inspection.productId);
                      const vios = violations.filter((v) => v.inspectionId === inspection.id);
                      const isCompliant = vios.length === 0;

                      return (
                        <tr
                          key={inspection.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="py-4 px-6 font-mono">
                            <span className="text-indigo-400 font-semibold">
                              {inspection.id}
                            </span>
                            <span className="block text-[10px] text-zinc-500">
                              LM/CERT/2026/{inspection.id}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span className="font-medium text-zinc-200 text-sm block">
                              {prod ? prod.name : "Packaged Commodity"}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {prod?.manufacturer || "Manufacturer per pack"}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span className="text-zinc-300 font-medium block">
                              {inspection.inspector}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {inspection.location}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-zinc-400 font-mono">
                            {inspection.date}
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                isCompliant
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              }`}
                            >
                              {isCompliant ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {isCompliant ? "COMPLIANT" : `${vios.length} VIOLATION${vios.length > 1 ? "S" : ""}`}
                              </span>
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`font-bold font-mono text-sm ${
                                (inspection.complianceScore || 90) >= 80
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {inspection.complianceScore || (isCompliant ? 95 : 65)}%
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownloadCSV(inspection)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border border-white/[0.05] hover:border-white/[0.1] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                                title="Download Editable CSV Dataset"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>CSV Data</span>
                              </button>

                              <button
                                onClick={() => handleDownloadPDF(inspection)}
                                disabled={generatingId === inspection.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                                title="Download Official Government PDF Certificate"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>
                                  {generatingId === inspection.id ? "Building..." : "PDF Report"}
                                </span>
                              </button>

                              <Link
                                href={`/inspection/${inspection.id}`}
                                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-colors"
                                title="View Split-Screen Inspection Audit"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
