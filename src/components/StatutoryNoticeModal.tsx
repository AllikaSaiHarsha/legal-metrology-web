"use client";

import React, { useState } from "react";
import {
  Gavel,
  FileText,
  ShieldAlert,
  Download,
  Copy,
  Check,
  X,
  AlertTriangle,
  Building2,
  Calendar,
  Scale,
  DollarSign,
  PackageCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  StatutoryNoticeData,
  NoticeType,
  OffenceTier,
  STATUTORY_PENALTY_RATES,
  calculateCompoundingFee,
  generateDefaultNoticeData,
} from "@/lib/statutoryNotices";
import { generateStatutoryNoticePDF } from "@/lib/pdfGenerator";
import { Inspection, Product, Violation } from "@/lib/inspectionsStore";

interface StatutoryNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: Inspection;
  product?: Product;
  violations?: Violation[];
}

export default function StatutoryNoticeModal({
  isOpen,
  onClose,
  inspection,
  product,
  violations = [],
}: StatutoryNoticeModalProps) {
  const [data, setData] = useState<StatutoryNoticeData>(() =>
    generateDefaultNoticeData(inspection, product, violations)
  );
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleTypeChange = (type: NoticeType) => {
    setData((prev) => ({
      ...prev,
      noticeType: type,
    }));
  };

  const handleTierChange = (tier: OffenceTier) => {
    const fee = calculateCompoundingFee(data.violations.length, tier);
    setData((prev) => ({
      ...prev,
      offenceTier: tier,
      compoundingFee: fee,
    }));
  };

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    try {
      generateStatutoryNoticePDF(data);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = async () => {
    const text = `
GOVERNMENT OF INDIA
DIRECTORATE OF LEGAL METROLOGY • ENFORCEMENT DIVISION
REF: ${data.noticeRef} | DATE: ${data.issueDate}

TO: M/s ${data.respondentName}
ADDRESS: ${data.respondentAddress}
ESTABLISHMENT CLASS: ${data.establishmentType}

SUBJECT: STATUTORY NOTICE REGARDING CONTRAVENTION IN "${data.productName}" (BATCH: ${data.batchNo})

WHEREAS on ${data.inspectionDate} at ${data.inspectionLocation}, the commodity was inspected under Section 15 of Legal Metrology Act, 2009. The following statutory non-compliances were recorded:
${data.violations.map((v, i) => `${i + 1}. [${v.ruleCode}] ${v.ruleTitle}: ${v.description}`).join("\n")}

${
  data.noticeType === "show_cause"
    ? `DIRECTIVE: You are hereby directed to SHOW CAUSE in writing within ${data.hearingDays} days from receipt why prosecution under Section 36(1) of the Act should not be instituted before the Competent Judicial Magistrate.`
    : data.noticeType === "compounding"
    ? `COMPOUNDING ASSESSMENT: Pursuant to Section 48, the offence may be compounded upon payment of INR ${data.compoundingFee.toLocaleString()} within ${data.hearingDays} days.`
    : `SEIZURE PARTICULARS: Under Section 15, ${data.seizedUnits} packages (with ${data.sampleUnitsSeized} test units under official seal) have been seized in the presence of Panch Witnesses: ${data.panch1Name} & ${data.panch2Name}.`
}

ISSUING OFFICER: ${data.inspectorName}
JURISDICTION: ${data.jurisdiction}
`.trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Statutory Enforcement Instrument Generator
                </h2>
                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
                  Section 18, 36 & 48
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Official Government of India Legal Metrology Form VI Notice & Seizure Memo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Instrument Type Tabs */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleTypeChange("show_cause")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                data.noticeType === "show_cause"
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-md shadow-amber-950/30"
                  : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Gavel className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Form VI Show Cause
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                15-day statutory explanation notice for Section 18 / PCR Rule 6 violations.
              </p>
            </button>

            <button
              onClick={() => handleTypeChange("compounding")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                data.noticeType === "compounding"
                  ? "bg-blue-500/15 border-blue-500/50 text-blue-200 shadow-md shadow-blue-950/30"
                  : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Compounding Notice
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Section 48 composition penalty assessment before court prosecution.
              </p>
            </button>

            <button
              onClick={() => handleTypeChange("seizure_memo")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                data.noticeType === "seizure_memo"
                  ? "bg-rose-500/15 border-rose-500/50 text-rose-200 shadow-md shadow-rose-950/30"
                  : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Seizure Panchnama
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Section 15 confiscation memo with independent panch witnesses.
              </p>
            </button>
          </div>

          {/* Form Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Notice Particulars */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Noticee & Commodity Particulars</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Respondent / Company Name
                </label>
                <input
                  type="text"
                  value={data.respondentName}
                  onChange={(e) => setData({ ...data, respondentName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Premises / Commercial Location
                </label>
                <input
                  type="text"
                  value={data.respondentAddress}
                  onChange={(e) => setData({ ...data, respondentAddress: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Commodity Name
                  </label>
                  <input
                    type="text"
                    value={data.productName}
                    onChange={(e) => setData({ ...data, productName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Batch / Lot Number
                  </label>
                  <input
                    type="text"
                    value={data.batchNo}
                    onChange={(e) => setData({ ...data, batchNo: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Response Window
                  </label>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{data.hearingDays} Days (Statutory)</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Notice Reference
                  </label>
                  <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 truncate">
                    {data.noticeRef}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Notice Specific Controls */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-4">
              {data.noticeType === "compounding" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Section 36 & 48 Penalty Composition</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 block">
                      Prior Offence Classification
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["first", "second", "subsequent"] as OffenceTier[]).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => handleTierChange(tier)}
                          className={`py-2 px-2.5 rounded-lg border text-xs capitalize font-semibold transition ${
                            data.offenceTier === tier
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Base Statutory Tariff:</span>
                      <span className="font-mono text-slate-200">
                        ₹{STATUTORY_PENALTY_RATES[data.offenceTier].baseFee.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Multiple Breach Add-on:</span>
                      <span className="font-mono text-slate-200">
                        +₹{(Math.max(0, data.violations.length - 1) * 5000).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200">
                        Total Compounding Fee:
                      </span>
                      <span className="text-base font-bold font-mono text-emerald-400">
                        ₹{data.compoundingFee.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {data.noticeType === "seizure_memo" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    <PackageCheck className="w-3.5 h-3.5 text-rose-400" />
                    <span>Seizure & Panchnama Particulars</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Total Packages Seized
                      </label>
                      <input
                        type="number"
                        value={data.seizedUnits}
                        onChange={(e) =>
                          setData({ ...data, seizedUnits: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Test Samples Drawn
                      </label>
                      <input
                        type="number"
                        value={data.sampleUnitsSeized}
                        onChange={(e) =>
                          setData({ ...data, sampleUnitsSeized: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Panch Witness 1 (Name & Address)
                    </label>
                    <input
                      type="text"
                      value={data.panch1Name}
                      onChange={(e) => setData({ ...data, panch1Name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Panch Witness 2 (Name & Address)
                    </label>
                    <input
                      type="text"
                      value={data.panch2Name}
                      onChange={(e) => setData({ ...data, panch2Name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              )}

              {data.noticeType === "show_cause" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Issuing Officer Signature Block</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Authorized Enforcement Officer
                    </label>
                    <input
                      type="text"
                      value={data.inspectorName}
                      onChange={(e) => setData({ ...data, inspectorName: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Zonal Enforcement Division
                    </label>
                    <input
                      type="text"
                      value={data.jurisdiction}
                      onChange={(e) => setData({ ...data, jurisdiction: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>
                      Notice served pursuant to Section 18 / 36 of Legal Metrology Act, 2009.
                      Non-compliance permits immediate prosecution without additional reminders.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Breaches Summary */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="uppercase tracking-wider">
                Infractions Cited in Instrument ({data.violations.length})
              </span>
              <span className="text-slate-500 font-mono text-[11px]">PCR 2011 Schedule II & III</span>
            </div>
            <div className="space-y-1.5">
              {data.violations.length === 0 ? (
                <p className="text-xs text-slate-500">No active infractions found in this inspection.</p>
              ) : (
                data.violations.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-400 font-semibold">{v.ruleCode}</span>
                      <span className="text-slate-300">{v.ruleTitle}</span>
                    </div>
                    <Badge variant={v.severity === "high" ? "destructive" : "warning"} className="text-[10px]">
                      {v.severity}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyText}
            className="text-xs text-slate-300 hover:text-white gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Notice Text</span>
              </>
            )}
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs gap-1.5 shadow-lg shadow-amber-950/40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isGenerating ? "Rendering PDF..." : "Download Official Notice (PDF)"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
