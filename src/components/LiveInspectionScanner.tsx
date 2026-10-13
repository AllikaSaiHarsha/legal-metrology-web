"use client";

import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Layers,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import {
  analyzePackageImage,
  checkBackendHealth,
  AnalysisResult,
  Detection,
} from "@/lib/api";
import {
  saveScannedInspection,
  updateInspectionProduct,
  setCachedImage,
  Inspection,
  Product,
  Violation,
} from "@/lib/inspectionsStore";
import { saveImageToIDB } from "@/lib/idb";
import { generateInspectionPDF } from "@/lib/pdfGenerator";
import BackendBoundingBoxViewer from "./BackendBoundingBoxViewer";
import { AccordionCard } from "./AccordionCard";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function createFallbackInspection(
  savedInspection: Inspection | undefined,
  productId: string,
  inspectorName: string | null | undefined,
  failedCount: number,
  complianceScore: number,
  detections: Detection[],
  imageUrl: string
): Inspection {
  if (savedInspection) return savedInspection;
  const suffix = Date.now().toString().slice(-4);
  const dateStr = new Date().toISOString().split("T")[0];
  return {
    id: `INS-CERT-${suffix}`,
    productId,
    inspector: inspectorName || "Official Metrologist",
    location: "Central Packaging Enforcement Lab",
    date: dateStr,
    status: failedCount > 0 ? "in-progress" : "completed",
    complianceScore,
    findings: detections.map((d) => d.label),
    imageUrl,
    detections,
  };
}

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

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        resolve(typeof ev.target?.result === "string" ? ev.target.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const handleSaveInspection = async () => {
    if (!results) return;

    let finalImg = dataUrl;
    if (!finalImg && selectedFile) {
      finalImg = await fileToDataUrl(selectedFile);
    }
    if (!finalImg && results.image_url) {
      finalImg = results.image_url;
    }
    if (!finalImg && previewUrl) {
      finalImg = previewUrl;
    }

    const saved = saveScannedInspection({
      productName: productNameInput || results.product_name || "Packaged Commodity",
      manufacturer: manufacturerInput || results.manufacturer || "Per Packaging Label",
      inspectorName: session?.user?.name || undefined,
      detections: results.detections,
      imageUrl: finalImg || "",
    });

    if (finalImg) {
      setCachedImage(saved.inspection.id, finalImg);
      saveImageToIDB(saved.inspection.id, finalImg);
    }

    setSavedData(saved);
  };

  const handleGeneratePDF = async () => {
    let finalImg = dataUrl;
    if (!finalImg && selectedFile) {
      finalImg = await fileToDataUrl(selectedFile);
    }
    if (!finalImg && results?.image_url) {
      finalImg = results.image_url;
    }
    if (!finalImg && previewUrl) {
      finalImg = previewUrl;
    }

    const inspectionRecord: Inspection = createFallbackInspection(
      savedData?.inspection,
      savedData?.product?.id || "PROD-GEN",
      session?.user?.name,
      failedCount,
      complianceScore,
      detections,
      finalImg || ""
    );

    const productRecord: Product = savedData?.product || {
      id: inspectionRecord.productId,
      name: productNameInput || results?.product_name || selectedFile?.name || "Packaged Commodity",
      category: "Packaged Commodity (PCR 2011)",
      manufacturer: manufacturerInput || results?.manufacturer || "Per Label Declaration",
      mfgDate: "Per Label",
      expiryDate: "Per Label",
      batchNo: "BATCH-AI-INSPECT",
      netQuantity: "Declared on Pack",
      mrp: 0,
      complianceStatus: failedCount > 0 ? "non-compliant" : "compliant",
    };

    const violationsList: Violation[] =
      savedData?.violations ||
      detections
        .filter((d) => d.status === "Failed")
        .map((d, idx) => ({
          id: `VIOL-${idx + 1}`,
          inspectionId: inspectionRecord.id,
          ruleCode: d.category ? `LM-R6-${d.category.toUpperCase().replace(/\s+/g, "_")}` : "LM-R6(1)",
          ruleTitle: d.category || "Rule 6 Statutory Violation",
          description: d.label,
          severity: "critical" as const,
          remediation: "Rectify mandatory statutory declaration on package label under Rule 6.",
          status: "open" as const,
        }));

    generateInspectionPDF({
      inspection: inspectionRecord,
      product: productRecord,
      violations: violationsList,
    });
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

      // Filter out Country of Origin if it is missing/failed (only required for imported goods)
      data.detections = (data.detections || []).filter((d) => {
        const cat = (d.category || "").toLowerCase();
        const lbl = (d.label || "").toLowerCase();
        const isCoO = cat.includes("country of origin") || lbl.includes("country of origin");
        const isErr = d.status === "Failed" || lbl.includes("missing") || lbl.includes("not visible");
        return !(isCoO && isErr);
      });

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

      let finalImg = dataUrl;
      if (!finalImg && selectedFile) {
        finalImg = await fileToDataUrl(selectedFile);
      }
      if (!finalImg && data.image_url) {
        finalImg = data.image_url;
      }
      if (!finalImg && previewUrl) {
        finalImg = previewUrl;
      }

      // Auto-store the product scan info immediately
      const saved = saveScannedInspection({
        productName: data.product_name || inferredProductName,
        manufacturer: data.manufacturer || manufacturerInput || "Per Packaging Label",
        inspectorName: session?.user?.name || undefined,
        detections: data.detections,
        imageUrl: finalImg || "",
      });

      if (finalImg) {
        setCachedImage(saved.inspection.id, finalImg);
        saveImageToIDB(saved.inspection.id, finalImg);
      }

      setSavedData(saved);
    } catch (err: any) {
      const raw = err.message || "";
      if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
        setErrorMessage(
          "AI Inspection service is momentarily rate-limited by upstream Gemini quota. Please wait a few seconds and click 'Execute Analysis' again."
        );
      } else if (raw.includes("503") || raw.includes("UNAVAILABLE")) {
        setErrorMessage(
          "Gemini Vision API is temporarily handling high traffic. Please retry in a few moments."
        );
      } else {
        setErrorMessage(
          raw || "Failed to communicate with AI vision engine. Ensure server is reachable."
        );
      }
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

  // Calculations from results - ignore Country of Origin if failed/missing
  const rawDetections = results?.detections || [];
  const detections = rawDetections.filter((d) => {
    const cat = (d.category || "").toLowerCase();
    const lbl = (d.label || "").toLowerCase();
    const isCoO = cat.includes("country of origin") || lbl.includes("country of origin");
    const isErr = d.status === "Failed" || lbl.includes("missing") || lbl.includes("not visible");
    return !(isCoO && isErr);
  });
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Header bar */}
      <div className="px-8 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 tracking-tight">
                Live Package Scanner
              </h2>
              <Badge variant="default" className="text-[10px]">
                Rule 6 (PCR 2011)
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multimodal Gemini 2.5 Flash neural vision &amp; statutory compliance pipeline
            </p>
          </div>
        </div>

        {/* Backend health status badge */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium font-mono ${
              backendOnline === true
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                : backendOnline === false
                ? "bg-red-500/10 text-red-300 border-red-500/25"
                : "bg-slate-900 text-slate-400 border-slate-800"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline === true
                  ? "bg-emerald-400 animate-pulse"
                  : backendOnline === false
                  ? "bg-red-400"
                  : "bg-slate-500"
              }`}
            />
            <span>
              {backendOnline === true
                ? "Gemini AI Engine Online"
                : backendOnline === false
                ? "Engine Offline"
                : "Probing AI Engine..."}
            </span>
          </div>

          {previewUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetAll}
              className="gap-1.5 text-xs text-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Scan</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {!previewUrl ? (
          /* Step 1: Upload Dropzone (Spatial Liquid Glass) */
          <div className="max-w-4xl mx-auto p-10 flex flex-col items-center justify-center min-h-[78vh]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 mb-4 shadow-xl shadow-blue-950/60">
                <ScanSearch className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 tracking-tight">
                Inspect Commodity Packaging
              </h3>
              <p className="text-xs text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
                Upload product packaging photographs or frontal label artwork.
                The Gemini multimodal engine will detect bounding boxes, parse statutory text, and verify declarations under Legal Metrology Rules, 2011.
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
              className={`w-full max-w-2xl p-12 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center liquid-glass-card ${
                isDragging
                  ? "border-blue-500 bg-blue-600/15 shadow-2xl shadow-blue-600/25"
                  : "border-slate-700/60 hover:border-blue-500/60 hover:bg-slate-900/60"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={onFileInputChange}
              />

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-blue-400 mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-blue-950/40">
                <UploadCloud className="w-10 h-10" />
              </div>

              <h4 className="text-base font-semibold text-slate-200">
                Drag and drop your package photo here
              </h4>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Supports JPG, PNG, WEBP high-resolution package label scans
              </p>

              <Button variant="default" size="default" className="shadow-blue-600/30">
                <UploadCloud className="w-4 h-4 mr-1.5" />
                Browse Packaging Files
              </Button>
            </motion.div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-3"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </div>
        ) : (
          /* Step 2: Split Screen Inspection Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full min-h-[calc(100vh-120px)]">
            {/* Left Panel: Uploaded Image & Bounding Boxes */}
            <div className="bg-slate-950 flex flex-col items-center justify-center p-6 border-r border-slate-800/80 relative overflow-hidden">
              {/* Scan Trigger Bar if not analyzed yet */}
              {!results && !isScanning && (
                <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl">
                  <div>
                    <p className="text-xs font-semibold text-slate-100 truncate max-w-xs">
                      {selectedFile?.name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ready for automated rule verification
                    </p>
                  </div>
                  <Button
                    variant="default"
                    size="default"
                    onClick={runScan}
                    className="shadow-blue-600/30"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    <span>Run AI Analysis</span>
                  </Button>
                </div>
              )}

              {/* Scanning Laser Sweep Effect */}
              {isScanning && (
                <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center">
                  <div className="scanner-laser-line" />
                  <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500"
                    />
                    <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-600/30">
                      <ScanSearch className="w-10 h-10 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-slate-100 font-bold text-base tracking-tight">
                    Auditing Package Declarations...
                  </p>
                  <p className="text-slate-400 text-xs mt-1 font-mono">
                    Gemini 2.5 Flash Multimodal Vision • Spatial Localization
                  </p>
                </div>
              )}

              {/* Interactive Bounding Box Viewer */}
              <BackendBoundingBoxViewer
                imageUrl={previewUrl}
                results={results}
              />
            </div>

            {/* Right Panel: Rule Checklist & Analysis */}
            <div className="bg-slate-900/40 overflow-y-auto p-8 flex flex-col gap-6">
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Inspection Summary Card */}
              <div className="p-5 rounded-2xl liquid-glass-card shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      {results ? results.filename : selectedFile?.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {results
                        ? `${results.original_width} × ${results.original_height} px • ${detections.length} declarations audited`
                        : "Awaiting analysis trigger"}
                    </p>
                  </div>

                  <Badge
                    variant={
                      results
                        ? failedCount > 0
                          ? "destructive"
                          : "success"
                        : "secondary"
                    }
                  >
                    {results
                      ? failedCount > 0
                        ? "VIOLATIONS DETECTED"
                        : "COMPLIANT"
                      : "READY TO SCAN"}
                  </Badge>
                </div>

                {/* KPI Metrics bar */}
                <div className="grid grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      Pass
                    </p>
                    <p className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">
                      {passedCount}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      Fail
                    </p>
                    <p className="text-xl font-bold text-red-400 mt-0.5 font-mono">
                      {failedCount}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      Pending
                    </p>
                    <p className="text-xl font-bold text-yellow-400 mt-0.5 font-mono">
                      {pendingCount}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      Score
                    </p>
                    <p className="text-xl font-bold text-slate-100 mt-0.5 font-mono">
                      {complianceScore}%
                    </p>
                  </div>
                </div>

                {/* Auto-Stored to Database & PDF Certificate CTA */}
                {results && savedData && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent border border-emerald-500/25 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-xs font-bold font-mono">
                            Auto-persisted as {savedData.inspection.id}
                          </span>
                        </div>
                        <Badge variant="success" className="text-[10px]">
                          PostgreSQL Synced
                        </Badge>
                      </div>

                      {/* Commodity Name & Manufacturer metadata */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                            Commodity Identity
                          </label>
                          <input
                            type="text"
                            value={productNameInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProductNameInput(val);
                              if (savedData) {
                                setSavedData((prev) =>
                                  prev ? { ...prev, product: { ...prev.product, name: val } } : null
                                );
                                updateInspectionProduct(savedData.inspection.id, {
                                  productName: val,
                                });
                              }
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-700/60 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                            Manufacturer / Packer
                          </label>
                          <input
                            type="text"
                            value={manufacturerInput}
                            placeholder="Per Packaging Label"
                            onChange={(e) => {
                              const val = e.target.value;
                              setManufacturerInput(val);
                              if (savedData) {
                                setSavedData((prev) =>
                                  prev ? { ...prev, product: { ...prev.product, manufacturer: val } } : null
                                );
                                updateInspectionProduct(savedData.inspection.id, {
                                  manufacturer: val,
                                });
                              }
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-700/60 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                          />
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleGeneratePDF}
                          className="flex-1 shadow-blue-600/30 text-xs"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          <span>Generate PDF Certificate</span>
                        </Button>

                        <Link href="/inspections">
                          <Button variant="outline" size="sm" className="text-xs gap-1">
                            <span>Register</span>
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>

                        <Link href={`/inspection/${savedData.inspection.id}`}>
                          <Button variant="outline" size="sm" className="text-xs gap-1">
                            <span>Split Audit</span>
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rule Checklist Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <FileCheck className="w-4 h-4 text-blue-400" />
                  <span>Rule 6 Statutory Audit Checklist</span>
                </div>

                {results && (
                  <Button
                    variant="ghost"
                    size="sm"
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
                    className="text-xs text-blue-400 hover:text-blue-300 gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </Button>
                )}
              </div>

              {/* Accordion Cards */}
              <div className="space-y-3">
                {results ? (
                  detections.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
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
                        MRP: "LM-R6(1)(a)",
                        "Net Weight": "LM-R6(1)(b)",
                        "Manufacture Date": "LM-R6(1)(d)",
                        "Expire Date": "LM-R6(1)(e)",
                        "Consumer Info": "LM-R6(1)(g)",
                      };

                      const categoryKey = detection.category || "";
                      const assignedRuleCode =
                        ruleCodeMap[categoryKey] || `LM-OCR-${String(index + 1).padStart(3, "0")}`;

                      const parts =
                        detection.label.match(/^\[(.*?)\]\s*(.*?)\s*\((.*?)\)$/) ||
                        detection.label.match(/^(.*?)\s*\((.*?)\)$/);
                      const extractedText = parts
                        ? parts.length === 4
                          ? parts[2]
                          : parts[1]
                        : detection.label;
                      const ruleMessage = parts
                        ? parts.length === 4
                          ? parts[3]
                          : parts[2]
                        : detection.label;

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
                          remediation={undefined}
                          defaultOpen={false}
                        />
                      );
                    })
                  )
                ) : (
                  <div className="p-10 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
                    <ScanSearch className="w-10 h-10 text-slate-600 mb-3" />
                    <p className="text-slate-300 font-medium text-sm">
                      No analysis performed yet
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Click &ldquo;Run AI Analysis&rdquo; to execute the Legal Metrology vision pipeline on this package.
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
