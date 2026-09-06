"use client";

import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  ScanSearch,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Server,
  ArrowLeft,
  Sparkles,
  Download,
  Save,
  BookmarkCheck,
  FileText,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  analyzePackageImage,
  checkBackendHealth,
  AnalysisResult,
} from "@/lib/api";
import {
  saveScannedInspection,
  updateInspectionProduct,
  Inspection,
  Product,
  Violation,
} from "@/lib/inspectionsStore";
import { generateInspectionPDF } from "@/lib/pdfGenerator";
import BackendBoundingBoxViewer from "./BackendBoundingBoxViewer";
import { AccordionCard } from "./AccordionCard";
import { useSession } from "next-auth/react";

export default function LiveInspectionScanner() {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [productNameInput, setProductNameInput] = useState("");
  const [manufacturerInput, setManufacturerInput] = useState("");
  const [packageHeightInput, setPackageHeightInput] = useState<string>("");
  const [savedData, setSavedData] = useState<{
    inspection: Inspection;
    product: Product;
    violations: Violation[];
  } | null>(null);

  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkBackendHealth().then((online) => setBackendOnline(online));
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid image file (JPEG, PNG, WebP).");
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setResults(null);
    setSavedData(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setDataUrl(ev.target.result);
      }
    };
    reader.readAsDataURL(file);

    const cleanName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    setProductNameInput(cleanName);
  };

  const handleSaveInspection = () => {
    if (!results || !previewUrl) return;

    const saved = saveScannedInspection({
      productName: productNameInput || "Scanned Commodity",
      manufacturer: manufacturerInput || "Per Packaging Label",
      detections: results.detections,
      imageUrl: dataUrl || previewUrl,
    });

    setSavedData(saved);
  };

  const handleGeneratePDF = () => {
    if (savedData) {
      generateInspectionPDF({
        inspection: savedData.inspection,
        product: savedData.product,
        violations: savedData.violations,
      });
    } else if (results && previewUrl) {
      const saved = saveScannedInspection({
        productName: productNameInput || "Scanned Commodity",
        manufacturer: manufacturerInput || "Per Packaging Label",
        detections: results.detections,
        imageUrl: previewUrl,
      });
      setSavedData(saved);
      generateInspectionPDF({
        inspection: saved.inspection,
        product: saved.product,
        violations: saved.violations,
      });
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const runScan = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setErrorMessage(null);

    try {
      const heightVal = parseFloat(packageHeightInput);
      const data = await analyzePackageImage(
        selectedFile, 
        !isNaN(heightVal) && heightVal > 0 ? heightVal : undefined
      );
      setResults(data);

      const inferredProductName =
        data.product_name ||
        productNameInput ||
        selectedFile.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
          
      if (data.product_name) setProductNameInput(data.product_name);
      if (data.manufacturer) setManufacturerInput(data.manufacturer);

      // Auto-store the product scan info immediately
      const saved = saveScannedInspection({
        productName: data.product_name || inferredProductName,
        manufacturer: data.manufacturer || manufacturerInput || "Per Packaging Label",
        inspectorName: session?.user?.name || undefined,
        detections: data.detections,
        imageUrl: data.image_url || dataUrl || previewUrl || "",
      });

      setSavedData(saved);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          "Failed to communicate with FastAPI backend. Ensure server is active on port 8000."
      );
    } finally {
      setIsScanning(false);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults(null);
    setErrorMessage(null);
  };

  // Calculations from results
  const detections = results?.detections || [];
  const passedCount = detections.filter((d) => d.status === "Passed").length;
  const failedCount = detections.filter((d) => d.status === "Failed").length;
  const pendingCount = detections.filter(
    (d) => d.status !== "Passed" && d.status !== "Failed"
  ).length;

  const complianceScore =
    detections.length > 0
      ? Math.round(
          ((passedCount + pendingCount * 0.5) / detections.length) * 100
        )
      : 100;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* Header bar */}
      <div className="px-8 py-4 border-b border-white/[0.06] flex items-center justify-between bg-zinc-900/40 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <span>Live Package Scanner</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                Legal Metrology Rule 2011
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Run automated OCR extraction & mandatory packaging compliance verification
            </p>
          </div>
        </div>

        {/* Backend health status badge */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
              backendOnline === true
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : backendOnline === false
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "bg-zinc-800 text-zinc-400 border-white/[0.08]"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline === true
                  ? "bg-emerald-400 animate-pulse"
                  : backendOnline === false
                  ? "bg-rose-400"
                  : "bg-zinc-500"
              }`}
            />
            <span>
              {backendOnline === true
                ? "FastAPI Connected (Port 8000)"
                : backendOnline === false
                ? "Backend Offline"
                : "Checking Backend..."}
            </span>
          </div>

          {previewUrl && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] border border-white/[0.08] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {!previewUrl ? (
          /* Step 1: Upload Zone */
          <div className="max-w-4xl mx-auto p-10 flex flex-col items-center justify-center min-h-[75vh]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-xl shadow-indigo-500/10">
                <ScanSearch className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-100 tracking-tight">
                Scan Package for Compliance
              </h3>
              <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
                Upload a clear photo of the product package or commodity label. The Python FastAPI engine will perform OCR and check for all mandatory declarations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-2xl p-12 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center ${
                isDragging
                  ? "border-indigo-500 bg-indigo-500/10 shadow-2xl shadow-indigo-500/20"
                  : "border-white/[0.1] bg-zinc-900/40 hover:border-indigo-500/50 hover:bg-zinc-900/70"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={onFileInputChange}
              />

              <div className="p-4 rounded-2xl bg-white/[0.04] text-zinc-400 mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-10 h-10 text-indigo-400" />
              </div>

              <h4 className="text-base font-semibold text-zinc-200">
                Drag and drop your package image here
              </h4>
              <p className="text-xs text-zinc-500 mt-1 mb-6">
                Supports JPG, PNG, WEBP high-resolution package scans
              </p>

              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                Browse Files
              </button>
            </motion.div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </div>
        ) : (
          /* Step 2: Inspection Split Screen */
          <div className="grid grid-cols-2 gap-0 h-full min-h-[calc(100vh-140px)]">
            {/* Left Panel: Uploaded Image & Bounding Boxes */}
            <div className="bg-zinc-950 flex flex-col items-center justify-center p-6 border-r border-white/[0.06] relative">
              {/* Scan Trigger Bar if not analyzed yet */}
              {!results && !isScanning && (
                <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between p-4 bg-zinc-900/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl">
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">
                      {selectedFile?.name}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Ready for automated rule verification
                    </p>
                  </div>
                  <button
                    onClick={runScan}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run Backend Analysis</span>
                  </button>
                </div>
              )}

              {/* Scanning Overlay Effect */}
              {isScanning && (
                <div className="absolute inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-indigo-500/30 border-t-indigo-500"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400"
                    >
                      <ScanSearch className="w-10 h-10" />
                    </motion.div>
                  </div>
                  <p className="text-zinc-200 font-semibold text-base">
                    Executing Tesseract OCR & Rule Engine...
                  </p>
                  <p className="text-zinc-500 text-xs mt-1 font-mono">
                    POST {process.env.NEXT_PUBLIC_API_URL || "https://legal-metrology-backend-dhto.onrender.com/api/v1"}/analyze
                  </p>
                </div>
              )}

              {/* Viewer */}
              <BackendBoundingBoxViewer
                imageUrl={previewUrl}
                results={results}
              />
            </div>

            {/* Right Panel: Rule Checklist & Analysis */}
            <div className="bg-zinc-900/40 overflow-y-auto p-8 flex flex-col gap-6">
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Inspection Summary Card */}
              <div className="p-5 rounded-3xl bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">
                      {results ? results.filename : selectedFile?.name}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      {results
                        ? `${results.original_width} × ${results.original_height} px • ${detections.length} regions evaluated`
                        : "Awaiting analysis execution"}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      results
                        ? failedCount > 0
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400 border-white/[0.08]"
                    }`}
                  >
                    {results
                      ? failedCount > 0
                        ? "VIOLATIONS DETECTED"
                        : "COMPLIANT"
                      : "READY TO SCAN"}
                  </span>
                </div>

                {/* KPI Metrics bar */}
                <div className="grid grid-cols-4 gap-3 pt-3 border-t border-white/[0.06]">
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      Pass
                    </p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">
                      {passedCount}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      Fail
                    </p>
                    <p className="text-xl font-bold text-rose-400 mt-1">
                      {failedCount}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      Pending
                    </p>
                    <p className="text-xl font-bold text-amber-400 mt-1">
                      {pendingCount}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      Score
                    </p>
                    <p className="text-xl font-bold text-zinc-100 mt-1">
                      {complianceScore}%
                    </p>
                  </div>
                </div>

                {/* Auto-Stored to Inspections & PDF Export Action Panel */}
                {results && savedData && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-indigo-500/10 to-transparent border border-emerald-500/30 space-y-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <span className="text-xs font-bold">
                            Auto-Stored to Inspections as {savedData.inspection.id}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          Synced with Dashboard
                        </span>
                      </div>

                      {/* Quick Edit of Product Name / Manufacturer */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                            Commodity Name
                          </label>
                          <input
                            type="text"
                            value={productNameInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProductNameInput(val);
                              if (savedData) {
                                setSavedData(prev => prev ? { ...prev, product: { ...prev.product, name: val } } : null);
                                updateInspectionProduct(savedData.inspection.id, {
                                  productName: val,
                                });
                              }
                            }}
                            className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                            Manufacturer
                          </label>
                          <input
                            type="text"
                            value={manufacturerInput}
                            placeholder="Per Packaging Label"
                            onChange={(e) => {
                              const val = e.target.value;
                              setManufacturerInput(val);
                              if (savedData) {
                                setSavedData(prev => prev ? { ...prev, product: { ...prev.product, manufacturer: val } } : null);
                                updateInspectionProduct(savedData.inspection.id, {
                                  manufacturer: val,
                                });
                              }
                            }}
                            className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                          />
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleGeneratePDF}
                          className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.01]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF Certificate</span>
                        </button>

                        <Link
                          href="/inspections"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-white/[0.08] text-xs font-medium transition-colors"
                        >
                          <span>Inspections</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>

                        <Link
                          href={`/inspection/${savedData.inspection.id}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-white/[0.08] text-xs font-medium transition-colors"
                        >
                          <span>Split Audit</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rule Checklist Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                  <FileCheck className="w-4 h-4 text-indigo-400" />
                  <span>Rule Engine Evaluation</span>
                </div>

                {results && (
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(results, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `compliance-${results.filename}.json`;
                      a.click();
                    }}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                )}
              </div>

              {/* Accordion Cards */}
              <div className="space-y-3">
                {results ? (
                  detections.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-zinc-900/40 border border-white/[0.06] text-center text-zinc-400 text-sm">
                      No text detected with high confidence in this image. Ensure the image is well-lit and packaging text is legible.
                    </div>
                  ) : (
                    detections.map((detection, index) => {
                      const isFailed = detection.status === "Failed";
                      const isPassed = detection.status === "Passed";

                      const statusType: "pass" | "fail" | "warning" = isFailed
                        ? "fail"
                        : isPassed
                        ? "pass"
                        : "warning";

                      const severityType: "critical" | "major" | "minor" = isFailed
                        ? "critical"
                        : isPassed
                        ? "minor"
                        : "major";

                      const ruleCodeMap: Record<string, string> = {
                        "MRP": "LM-R6(1)(a)",
                        "Net Weight": "LM-R6(1)(b)",
                        "Manufacture Date": "LM-R6(1)(d)",
                        "Expire Date": "LM-R6(1)(e)",
                        "Consumer Info": "LM-R6(1)(g)",
                      };

                      const categoryKey = detection.category || "";
                      const assignedRuleCode = ruleCodeMap[categoryKey] || `LM-OCR-${String(index + 1).padStart(3, "0")}`;

                      // Extract rule and text from "[Category] Text (Message)" format
                      const parts = detection.label.match(/^\[(.*?)\]\s*(.*?)\s*\((.*?)\)$/) || detection.label.match(/^(.*?)\s*\((.*?)\)$/);
                      const extractedText = parts ? (parts.length === 4 ? parts[2] : parts[1]) : detection.label;
                      const ruleMessage = parts ? (parts.length === 4 ? parts[3] : parts[2]) : detection.label;

                      return (
                        <AccordionCard
                          key={index}
                          ruleCode={assignedRuleCode}
                          title={categoryKey ? `${categoryKey} — ${ruleMessage}` : ruleMessage}
                          severity={severityType}
                          status={statusType}
                          description={`OCR bounding box coordinates on package: [x:${detection.box.x}, y:${detection.box.y}, width:${detection.box.width}px, height:${detection.box.height}px].`}
                          extractedValue={extractedText}
                          expectedValue={
                            isFailed
                              ? "Mandatory declaration under Legal Metrology (Packaged Commodities) Rules, 2011"
                              : undefined
                          }
                          remediation={
                            isFailed
                              ? "Ensure declaration is clearly printed, legible, and includes all mandatory statutory notices."
                              : undefined
                          }
                          defaultOpen={index === 0}
                        />
                      );
                    })
                  )
                ) : (
                  <div className="p-10 rounded-3xl bg-zinc-900/30 border border-dashed border-white/[0.08] text-center flex flex-col items-center justify-center">
                    <ScanSearch className="w-10 h-10 text-zinc-600 mb-3" />
                    <p className="text-zinc-300 font-medium text-sm">
                      No analysis performed yet
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                      Click &ldquo;Run Backend Analysis&rdquo; to send the package to the FastAPI engine on port 8000.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
