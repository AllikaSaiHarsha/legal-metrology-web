"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Download,
  Filter,
  Sparkles,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { BentoCard } from "@/components/BentoCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedInspections = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar
          title="Inspections Registry"
          subtitle="Statutory enforcement audit history and compliance log"
          action={
            <Link href="/scan">
              <Button size="sm" variant="default" className="shadow-blue-600/30 gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Label Scan</span>
              </Button>
            </Link>
          }
        />

        <div className="p-8 space-y-6 max-w-7xl">
          {/* Top Quick Stats Grid (Bento) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <BentoCard delay={0.05} glowColor="rgba(37, 99, 235, 0.2)">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Total Audits
                  </p>
                  <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">{total}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.1} glowColor="rgba(34, 197, 94, 0.2)">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{completed}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.15} glowColor="rgba(239, 68, 68, 0.2)">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Violations Flagged
                  </p>
                  <p className="text-2xl font-bold text-red-400 mt-1 font-mono">{withViolations}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.2} glowColor="rgba(234, 179, 8, 0.2)">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-yellow-400 mt-1 font-mono">{inProgress}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center text-yellow-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl liquid-glass-card">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search audits by commodity, ID, officer, jurisdiction..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/70 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <Button
                variant={statusFilter === "all" ? "default" : "secondary"}
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className="text-xs"
              >
                All Audits
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "secondary"}
                size="sm"
                onClick={() => {
                  setStatusFilter("completed");
                  setCurrentPage(1);
                }}
                className="text-xs"
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === "violations" ? "destructive" : "secondary"}
                size="sm"
                onClick={() => {
                  setStatusFilter("violations");
                  setCurrentPage(1);
                }}
                className="text-xs"
              >
                With Violations
              </Button>
            </div>
          </div>

          {/* Precision Table Card */}
          <div className="rounded-2xl liquid-glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Audit ID</TableHead>
                  <TableHead>Packaged Commodity</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Audit Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedInspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                      No inspections found matching your search filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInspections.map((inspection) => {
                    const prod = products.find((p) => p.id === inspection.productId);
                    const vios = violations.filter((v) => v.inspectionId === inspection.id);
                    const isScan = inspection.id.startsWith("INS-SCAN");
                    const isPass = inspection.complianceScore >= 85;
                    const isWarning =
                      inspection.complianceScore >= 70 && inspection.complianceScore < 85;

                    return (
                      <TableRow key={inspection.id}>
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/inspection/${inspection.id}`}
                              className="text-blue-400 hover:text-blue-300 font-semibold"
                            >
                              {inspection.id}
                            </Link>
                            {isScan && (
                              <Badge variant="default" className="text-[9px] px-1.5 py-0">
                                AI SCAN
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-semibold text-slate-100 text-xs block">
                            {prod ? prod.name : "Packaged Commodity"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {prod?.manufacturer || "Manufacturer per label"}
                          </span>
                        </TableCell>

                        <TableCell className="text-slate-300 font-medium text-xs">
                          {inspection.inspector}
                        </TableCell>

                        <TableCell className="text-slate-400 text-xs">
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
                                : "destructive"
                            }
                          >
                            {inspection.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
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
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDownloadPDF(inspection)}
                              title="Download PDF Certificate"
                              className="text-slate-400 hover:text-blue-300"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>

                            <Link href={`/inspection/${inspection.id}`}>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="View Split Screen Audit"
                                className="text-slate-400 hover:text-slate-200"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </Link>

                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                if (
                                  confirm(`Are you sure you want to delete inspection ${inspection.id}?`)
                                ) {
                                  deleteInspection(inspection.id);
                                }
                              }}
                              title="Delete Record"
                              className="text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing {Math.min(filtered.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to{" "}
                {Math.min(filtered.length, currentPage * ITEMS_PER_PAGE)} of {filtered.length} records
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>

                <span className="font-mono px-2 text-slate-300">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1 text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
