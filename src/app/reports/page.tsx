"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
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
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
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
  loadStore,
  subscribeStore,
  Inspection,
  Product,
  Violation,
  hydrateStoreFromDB,
} from "@/lib/inspectionsStore";
import { generateInspectionPDF } from "@/lib/pdfGenerator";

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

    const headers = [
      "Inspection ID",
      "Date",
      "Product Name",
      "Manufacturer",
      "Inspector",
      "Location",
      "Overall Compliance",
      "Rule Breached",
      "Severity",
    ];
    const rows: string[] = [];

    if (vios.length === 0) {
      rows.push(
        [
          inspection.id,
          inspection.date,
          `"${prod?.name || "N/A"}"`,
          `"${prod?.manufacturer || "N/A"}"`,
          `"${inspection.inspector}"`,
          `"${inspection.location}"`,
          "COMPLIANT",
          "None",
          "N/A",
        ].join(",")
      );
    } else {
      vios.forEach((v) => {
        rows.push(
          [
            inspection.id,
            inspection.date,
            `"${prod?.name || "N/A"}"`,
            `"${prod?.manufacturer || "N/A"}"`,
            `"${inspection.inspector}"`,
            `"${inspection.location}"`,
            "NON-COMPLIANT",
            `"${v.ruleTitle}"`,
            v.severity,
          ].join(",")
        );
      });
    }

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inspection_report_${inspection.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar
          title="Compliance Reports & Certificates"
          subtitle="Official Legal Metrology PCR 2011 court-admissible certificate registry"
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
          {/* Quick Metrics Bar (Bento) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <BentoCard delay={0.05} glowColor="rgba(37, 99, 235, 0.2)">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Total Certificates
                  </p>
                  <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">
                    {totalReports}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.1} glowColor="rgba(34, 197, 94, 0.2)">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Compliant Cleared
                  </p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                    {compliantCount}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.15} glowColor="rgba(239, 68, 68, 0.2)">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Violation Notices
                  </p>
                  <p className="text-2xl font-bold text-red-400 mt-1 font-mono">
                    {nonCompliantCount}
                  </p>
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
                    Average Score
                  </p>
                  <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">
                    {avgScore}%
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center text-yellow-400">
                  <FileCheck2 className="w-5 h-5" />
                </div>
              </div>
            </BentoCard>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl liquid-glass-card">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search certificate by commodity, officer, ID, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/70 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "secondary"}
                size="sm"
                onClick={() => setFilterStatus("all")}
                className="text-xs"
              >
                All Reports
              </Button>
              <Button
                variant={filterStatus === "compliant" ? "default" : "secondary"}
                size="sm"
                onClick={() => setFilterStatus("compliant")}
                className="text-xs"
              >
                Compliant
              </Button>
              <Button
                variant={filterStatus === "non-compliant" ? "destructive" : "secondary"}
                size="sm"
                onClick={() => setFilterStatus("non-compliant")}
                className="text-xs"
              >
                Violations
              </Button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="rounded-2xl liquid-glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate Ref / ID</TableHead>
                  <TableHead>Packaged Commodity</TableHead>
                  <TableHead>Enforcement Officer</TableHead>
                  <TableHead>Audit Date</TableHead>
                  <TableHead>Statutory Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Export Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredInspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      No inspection reports match your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInspections.map((inspection) => {
                    const prod = products.find((p) => p.id === inspection.productId);
                    const vios = violations.filter((v) => v.inspectionId === inspection.id);
                    const isCompliant = vios.length === 0;

                    return (
                      <TableRow key={inspection.id}>
                        <TableCell className="font-mono text-xs">
                          <span className="text-blue-400 font-semibold block">
                            {inspection.id}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            LM/CERT/2026/{inspection.id}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-semibold text-slate-100 text-xs block">
                            {prod ? prod.name : "Packaged Commodity"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {prod?.manufacturer || "Manufacturer per label"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-slate-300 font-medium text-xs block">
                            {inspection.inspector}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {inspection.location}
                          </span>
                        </TableCell>

                        <TableCell className="text-slate-400 font-mono text-xs">
                          {inspection.date}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={isCompliant ? "success" : "destructive"}
                            className="gap-1 text-[10px]"
                          >
                            {isCompliant ? (
                              <CheckCircle2 className="w-3 h-3 inline" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 inline" />
                            )}
                            <span>
                              {isCompliant
                                ? "COMPLIANT"
                                : `${vios.length} VIOLATION${vios.length > 1 ? "S" : ""}`}
                            </span>
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`font-mono font-semibold text-xs ${
                              (inspection.complianceScore || 90) >= 80
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {inspection.complianceScore || (isCompliant ? 95 : 65)}%
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadCSV(inspection)}
                              className="text-xs gap-1.5"
                              title="Export Raw CSV Data"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>CSV</span>
                            </Button>

                            <Button
                              variant="default"
                              size="sm"
                              disabled={generatingId === inspection.id}
                              onClick={() => handleDownloadPDF(inspection)}
                              className="text-xs gap-1.5 shadow-blue-600/30"
                              title="Generate Official PDF Certificate"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>
                                {generatingId === inspection.id ? "Building..." : "PDF Certificate"}
                              </span>
                            </Button>

                            <Link href={`/inspection/${inspection.id}`}>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Split-Screen Audit"
                                className="text-slate-400 hover:text-slate-200"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
