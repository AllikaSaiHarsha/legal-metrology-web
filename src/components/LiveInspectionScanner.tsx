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
  getCachedImage,
  loadStore,
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
  const [triageQueue, setTriageQueue] = useState<{ inspection: Inspection; product?: Product }[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkBackendHealth().then((online) => setBackendOnline(online));
    try {
      const store = loadStore();
      const queue = store.inspections.slice(0, 8).map((ins) => ({
        inspection: ins,
        product: store.products.find((p) => p.id === ins.productId),
      }));
      setTriageQueue(queue);
      if (queue.length > 0 && !previewUrl) {
        const first = queue[0];
        const img = getCachedImage(first.inspection.id) || first.inspection.imageUrl;
        if (img) {
          setSelectedQueueId(first.inspection.id);
          setPreviewUrl(img);
          setDataUrl(img);
          setProductNameInput(first.product?.name || "Packaged Commodity");
          setManufacturerInput(first.product?.manufacturer || "Per Label Declaration");
          if (first.inspection.detections && first.inspection.detections.length > 0) {
            setResults({
              filename: `${first.inspection.id}.jpg`,
              original_width: 1000,
              original_height: 1000,
              detections: first.inspection.detections,
              product_name: first.product?.name,
              manufacturer: first.product?.manufacturer,
              image_url: img,
            });
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSelectQueueItem = (item: { inspection: Inspection; product?: Product }) => {
    setSelectedQueueId(item.inspection.id);
    const img = getCachedImage(item.inspection.id) || item.inspection.imageUrl;
    setSelectedFile(null);
    setPreviewUrl(img || null);
    setDataUrl(img || null);
    setProductNameInput(item.product?.name || "Packaged Commodity");
    setManufacturerInput(item.product?.manufacturer || "Per Label Declaration");

    if (item.inspection.detections && item.inspection.detections.length > 0) {
      setResults({
        filename: `${item.inspection.id}.jpg`,
        original_width: 1000,
        original_height: 1000,
        detections: item.inspection.detections,
        product_name: item.product?.name,
        manufacturer: item.product?.manufacturer,
        image_url: img,
      });
    } else {
      setResults(null);
    }
    setSavedData(null);
  };

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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100 select-none pb-20">
      {/* Header bar */}
      <div className="px-6 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/90 backdrop-blur-xl shrink-0">
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
                Optical Inspection Studio
              </h2>
              <Badge variant="default" className="text-[10px] bg-blue-600/20 text-blue-300 border-blue-500/30">
                Rule 6 (PCR 2011)
              </Badge>
              {results && (
                <Badge
                  variant={failedCount > 0 ? "destructive" : "success"}
                  className="text-[10px]"
                >
                  {failedCount > 0 ? `${failedCount} VIOLATIONS` : "FULLY COMPLIANT"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multimodal Gemini 2.5 Flash neural vision • Statutory package metrology pipeline
            </p>
          </div>
        </div>

        {/* Action Controls & AI Backend Status */}
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
                : "Probing Engine..."}
            </span>
          </div>

          {previewUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetAll}
              className="gap-1.5 text-xs text-slate-300 border-slate-800 hover:bg-slate-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Canvas</span>
            </Button>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={onFileInputChange}
      />

      {/* 3-Pane Studio Workbench */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: Triage Queue & Inspection History */}
        <div className="w-72 border-r border-slate-800/80 bg-slate-950/80 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Triage Queue
              </h3>
              <p className="text-[11px] text-slate-500">
                {triageQueue.length} packaged batches
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs flex items-center gap-1 transition-colors"
              title="Upload new packaging sample"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="font-medium text-[11px]">Upload</span>
            </button>
          </div>

          {/* Queue Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {triageQueue.map((item) => {
              const isSelected = selectedQueueId === item.inspection.id;
              const hasViolations = item.inspection.status === "in-progress" || (item.inspection.complianceScore ?? 100) < 100;
              const itemImg = getCachedImage(item.inspection.id) || item.inspection.imageUrl;

              return (
                <div
                  key={item.inspection.id}
                  onClick={() => handleSelectQueueItem(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-600/15 border-blue-500/50 shadow-md shadow-blue-950/50"
                      : "bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt="sample"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ScanSearch className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">
                        {item.product?.name || item.inspection.id}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {item.inspection.id}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            hasViolations ? "bg-amber-400" : "bg-emerald-400"
                          }`}
                        />
                        <span
                          className={`text-[10px] font-medium ${
                            hasViolations ? "text-amber-300" : "text-emerald-300"
                          }`}
                        >
                          {hasViolations ? "Infractions" : "Pass"}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-auto font-mono">
                          {item.inspection.complianceScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {triageQueue.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No items in queue. Upload a package to begin.
              </div>
            )}
          </div>
        </div>

        {/* Pane 2: Central Optical Bench Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative overflow-hidden">
          {/* Top Workbench Toolbar */}
          <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs text-slate-400">Package:</span>
              <input
                type="text"
                value={productNameInput}
                onChange={(e) => setProductNameInput(e.target.value)}
                placeholder="Product Name..."
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 w-52 focus:outline-none focus:border-blue-500 font-medium"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Height (mm):</span>
                <input
                  type="number"
                  value={packageHeightInput}
                  onChange={(e) => setPackageHeightInput(e.target.value)}
                  placeholder="e.g. 180"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 w-20 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={runScan}
                disabled={isScanning || !selectedFile}
                className="gap-1.5 text-xs shadow-lg shadow-blue-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isScanning ? "Analyzing..." : "Run AI Analysis"}</span>
              </Button>
            </div>
          </div>

          {/* Workbench Canvas Display */}
          <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
            {isScanning && (
              <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center">
                <div className="scanner-laser-line" />
                <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500"
                  />
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-600/30">
                    <ScanSearch className="w-8 h-8 animate-pulse" />
                  </div>
                </div>
                <p className="text-slate-100 font-bold text-sm tracking-tight">
                  Auditing Package Declarations...
                </p>
                <p className="text-slate-400 text-xs mt-1 font-mono">
                  Gemini 2.5 Flash Multimodal Vision • Spatial Localization
                </p>
              </div>
            )}

            {previewUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <BackendBoundingBoxViewer
                  imageUrl={previewUrl}
                  results={results}
                />
              </div>
            ) : (
              /* Dropzone if empty */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-xl p-12 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center liquid-glass-card ${
                  isDragging
                    ? "border-blue-500 bg-blue-600/15 shadow-2xl shadow-blue-600/25"
                    : "border-slate-800 hover:border-blue-500/60 hover:bg-slate-900/50"
                }`}
              >
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-blue-400 mb-4 shadow-lg shadow-blue-950/40">
                  <UploadCloud className="w-10 h-10" />
                </div>
                <h4 className="text-base font-semibold text-slate-200">
                  Load Package Sample
                </h4>
                <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm">
                  Drag and drop packaging artwork or select from the triage queue on the left.
                </p>
                <Button variant="outline" size="sm" className="border-slate-700 text-xs">
                  Browse Local Files
                </Button>
              </div>
            )}
          </div>

          {/* Workbench Status Footer Bar */}
          <div className="px-6 py-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-4">
              <span>CANVAS: {results ? `${results.original_width}×${results.original_height}px` : "1000×1000mm"}</span>
              <span>BOXES DETECTED: {detections.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">LEGAL METROLOGY ACT, 2009</span>
              <span>ISO/IEC 17025 COMPLIANT</span>
            </div>
          </div>
        </div>

        {/* Pane 3: Statutory Inspector HUD */}
        <div className="w-[400px] border-l border-slate-800/80 bg-slate-950/90 flex flex-col shrink-0 overflow-hidden">
          {/* Header with Score and Actions */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Statutory Inspector HUD
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                {complianceScore}% SCORE
              </span>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveInspection}
                disabled={!results}
                className="gap-1.5 text-xs border-slate-800 hover:bg-slate-900"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Save Record</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleGeneratePDF}
                disabled={!results}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Certificate</span>
              </Button>
            </div>
          </div>

          {/* Metadata Bar */}
          <div className="p-3 border-b border-slate-800/60 bg-slate-900/20 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Manufacturer</span>
              <input
                type="text"
                value={manufacturerInput}
                onChange={(e) => setManufacturerInput(e.target.value)}
                placeholder="Per Label"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-300 text-xs mt-0.5"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Status Summary</span>
              <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px]">
                <span className="text-emerald-400">{passedCount} Passed</span>
                <span className="text-slate-600">•</span>
                <span className="text-red-400">{failedCount} Infractions</span>
              </div>
            </div>
          </div>

          {/* Rule 6 Declarations List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {detections.length > 0 ? (
              detections.map((detection, index) => {
                const isPassed = detection.status === "Passed";
                const isFailed = detection.status === "Failed";
                const statusType: "pass" | "fail" | "warning" = isPassed
                  ? "pass"
                  : isFailed
                  ? "fail"
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
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
                <ScanSearch className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-slate-300 font-medium text-xs">
                  Awaiting AI Analysis
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click &ldquo;Run AI Analysis&rdquo; to execute the Legal Metrology vision pipeline on this package.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
