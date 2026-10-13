"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Download,
  Building,
  Package,
  Layers,
  Sparkles,
  UploadCloud,
  FileText,
  BadgeAlert,
  ArrowRight,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PreMarketAuditData,
  PreMarketCheckItem,
  DEFAULT_PRE_MARKET_RULES,
} from "@/lib/preMarketAudit";
import { generatePreMarketCertificatePDF } from "@/lib/pdfGenerator";

export default function PreMarketAuditPortal() {
  const [brandName, setBrandName] = useState("Nestlé India Ltd");
  const [skuTitle, setSkuTitle] = useState("Maggi 2-Minute Noodles Special Masala 280g");
  const [netQuantity, setNetQuantity] = useState("280 g");
  const [mrp, setMrp] = useState(60.0);
  const [areaCm2, setAreaCm2] = useState<number>(360);
  const [checks, setChecks] = useState<PreMarketCheckItem[]>(DEFAULT_PRE_MARKET_RULES);
  const [isAudited, setIsAudited] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Dynamic Numeral Height Calculation based on PCR 2011 Table I
  const requiredMinHeightMm = areaCm2 <= 50 ? 1.0 : areaCm2 <= 100 ? 1.5 : areaCm2 <= 500 ? 2.0 : areaCm2 <= 2500 ? 4.0 : 6.0;

  const passedCount = checks.filter((c) => c.status === "pass").length;
  const overallScore = Math.round((passedCount / checks.length) * 100);
  const verdict = overallScore >= 85 ? "APPROVED_FOR_PRINT" : "REVISIONS_REQUIRED";

  const handleToggleCheck = (id: string) => {
    setChecks((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "pass" ? "fail" : "pass";
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleDownloadCertificate = () => {
    const certData: PreMarketAuditData = {
      certificateId: `LM/PMC/2026/${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split("T")[0],
      brandName,
      manufacturerName: `${brandName} (Registered Packaging Facility)`,
      skuTitle,
      packageAreaCm2: areaCm2,
      declaredNetQuantity: netQuantity,
      declaredMrp: mrp,
      overallScore,
      verdict,
      checks,
    };
    generatePreMarketCertificatePDF(certData);
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="p-6 rounded-2xl liquid-glass-card border border-emerald-500/25 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
              Pre-Market Self-Audit Cell
            </Badge>
            <span className="text-xs text-slate-400 font-mono">PCR 2011 Rule 6 &amp; Table I</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            Brand Packaging Pre-Market Clearance Portal
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Audit high-resolution packaging artwork and proof designs before mass printing. Validate font numeral heights, unit symbols, mandatory declarations, and receive an official Legal Metrology Readiness Certificate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={handleDownloadCertificate}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 shadow-lg shadow-emerald-950/50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Clearance Certificate (PDF)</span>
          </Button>
        </div>
      </div>

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Artwork & Specs (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Packaging Parameters Card */}
          <div className="p-5 rounded-2xl liquid-glass-card border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>SKU &amp; Dimension Specifications</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Registered Brand / Manufacturer
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Commodity SKU Name
              </label>
              <input
                type="text"
                value={skuTitle}
                onChange={(e) => setSkuTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Declared Net Quantity
                </label>
                <input
                  type="text"
                  value={netQuantity}
                  onChange={(e) => setNetQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Proposed MRP (INR)
                </label>
                <input
                  type="number"
                  value={mrp}
                  onChange={(e) => setMrp(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400 block">
                  Principal Display Panel Area (cm²)
                </label>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {areaCm2} cm²
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={2800}
                value={areaCm2}
                onChange={(e) => setAreaCm2(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="mt-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Table I Mandated Numeral Height:</span>
                <span className="font-mono font-bold text-slate-100 text-xs">
                  {requiredMinHeightMm.toFixed(1)} mm
                </span>
              </div>
            </div>

            {/* Proof Upload Dropzone */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/40 text-center flex flex-col items-center justify-center cursor-pointer transition">
              <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-xs font-semibold text-slate-300">
                Upload Packaging Artwork Proof (PDF / PNG)
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Evaluates label typography, color contrast &amp; declaration positioning
              </p>
            </div>
          </div>
        </div>

        {/* Right Rules Engine: Statutory Audit Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Verdict Banner Card */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              verdict === "APPROVED_FOR_PRINT"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                : "bg-red-500/10 border-red-500/30 text-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  verdict === "APPROVED_FOR_PRINT"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {verdict === "APPROVED_FOR_PRINT" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  {verdict === "APPROVED_FOR_PRINT"
                    ? "Artwork Approved For Commercial Printing"
                    : "Statutory Revisions Required Before Print"}
                </h3>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Conformity Score: {overallScore}% • {passedCount} of {checks.length} statutory declarations certified
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCertificate}
              className="text-xs border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </Button>
          </div>

          {/* Statutory Declarations List */}
          <div className="p-5 rounded-2xl liquid-glass-card border border-slate-800 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Statutory Declarations Verification Checklist</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">7 Parameters</span>
            </div>

            <div className="space-y-2.5">
              {checks.map((item) => {
                const isPass = item.status === "pass";
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleCheck(item.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isPass
                        ? "bg-slate-900/70 border-slate-800 hover:border-emerald-500/40"
                        : "bg-red-500/10 border-red-500/30 hover:border-red-500/50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                          {item.ruleCitation}
                        </span>
                        <span className="text-xs font-bold text-slate-100">{item.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {item.specRequirement}
                      </p>
                      <p className="text-[11px] font-mono text-slate-300">
                        Observation: {item.detectedValue}
                      </p>
                    </div>

                    <Badge
                      variant={isPass ? "success" : "destructive"}
                      className="text-[10px] uppercase shrink-0 mt-0.5"
                    >
                      {item.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
