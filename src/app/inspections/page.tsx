"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Download,
  Filter,
  Sparkles,
  Trash2,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { BentoCard } from "@/components/BentoCard";
import {
  loadStore,
  subscribeStore,
  deleteInspection,
  hydrateStoreFromDB,
  Inspection,
  Product,
  Violation,
} from "@/lib/inspectionsStore";
import { generateInspectionPDF } from "@/lib/pdfGenerator";

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    hydrateStoreFromDB();
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
    const prod = products.find((p) => p.id === inspection.productId);
    const vios = violations.filter((v) => v.inspectionId === inspection.id);
    generateInspectionPDF({
      inspection,
      product: prod,
      violations: vios,
    });
  };

  const filtered = inspections.filter((ins) => {
    const prod = products.find((p) => p.id === ins.productId);
    const prodName = prod?.name || "";

    const matchesSearch =
      ins.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      ins.status === statusFilter ||
      (statusFilter === "violations" &&
        violations.some((v) => v.inspectionId === ins.id));

    return matchesSearch && matchesStatus;
  });

  const total = inspections.length;
  const completed = inspections.filter((i) => i.status === "completed").length;
  const inProgress = inspections.filter((i) => i.status === "in-progress").length;
  const withViolations = inspections.filter((ins) =>
    violations.some((v) => v.inspectionId === ins.id)
  ).length;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedInspections = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar
          title="Inspections Registry"
          subtitle="Enforcement audit history and scanned product records"
        />

        <div className="p-8 space-y-6">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-4 gap-6">
            <BentoCard delay={0.05}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 font-medium">Total Audits</p>
                  <p className="text-2xl font-bold text-zinc-100 mt-1">{total}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.1}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{completed}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.15}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 font-medium">Violations Flagged</p>
                  <p className="text-2xl font-bold text-rose-400 mt-1">{withViolations}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.2}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 font-medium">In Progress</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{inProgress}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>
          </div>

          {/* Search, Filter & CTA */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] shadow-xl">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search inspections by product, ID, inspector, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  statusFilter === "all"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  statusFilter === "completed"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter("violations")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  statusFilter === "violations"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                With Violations
              </button>

              <div className="w-px h-5 bg-white/[0.08] mx-1" />

              <Link
                href="/scan"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Package Scan</span>
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800/40 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-white/[0.06]">
                  <tr>
                    <th className="py-3.5 px-6 font-medium">Inspection ID</th>
                    <th className="py-3.5 px-6 font-medium">Product / Commodity</th>
                    <th className="py-3.5 px-6 font-medium">Inspector</th>
                    <th className="py-3.5 px-6 font-medium">Location</th>
                    <th className="py-3.5 px-6 font-medium">Date</th>
                    <th className="py-3.5 px-6 font-medium">Status</th>
                    <th className="py-3.5 px-6 font-medium">Score</th>
                    <th className="py-3.5 px-6 font-medium text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.04]">
                  {paginatedInspections.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-500">
                        No inspections match your search filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedInspections.map((inspection) => {
                      const prod = products.find((p) => p.id === inspection.productId);
                      const vios = violations.filter((v) => v.inspectionId === inspection.id);
                      const isScan = inspection.id.startsWith("INS-SCAN");

                      return (
                        <tr
                          key={inspection.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="py-4 px-6 font-mono">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/inspection/${inspection.id}`}
                                className="text-indigo-400 hover:text-indigo-300 font-semibold"
                              >
                                {inspection.id}
                              </Link>
                              {isScan && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  LIVE SCAN
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <span className="font-medium text-zinc-200 text-sm block">
                              {prod ? prod.name : "Packaged Commodity"}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {prod?.manufacturer || "Manufacturer per pack"}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-zinc-300 font-medium">
                            {inspection.inspector}
                          </td>

                          <td className="py-4 px-6 text-zinc-400">
                            {inspection.location}
                          </td>

                          <td className="py-4 px-6 text-zinc-400 font-mono">
                            {inspection.date}
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                inspection.status === "completed"
                                  ? vios.length === 0
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}
                            >
                              <span>
                                {vios.length > 0
                                  ? `${vios.length} VIOLATION${vios.length > 1 ? "S" : ""}`
                                  : inspection.status.toUpperCase()}
                              </span>
                            </span>
                          </td>

                          <td className="py-4 px-6 font-mono font-bold">
                            <span
                              className={
                                (inspection.complianceScore || 90) >= 80
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }
                            >
                              {inspection.complianceScore || 85}%
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownloadPDF(inspection)}
                                className="p-1.5 rounded-xl text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-colors"
                                title="Download PDF Report"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              <Link
                                href={`/inspection/${inspection.id}`}
                                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-colors"
                                title="View Split-Screen Inspection Audit"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              
                              <button
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this inspection? This will remove all associated product data and violations.")) {
                                    deleteInspection(inspection.id);
                                  }
                                }}
                                className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                                title="Delete Inspection"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] bg-zinc-900/40">
                <span className="text-xs text-zinc-400">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
