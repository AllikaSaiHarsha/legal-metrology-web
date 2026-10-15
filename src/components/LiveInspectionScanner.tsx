"use client";

import React, { useState, useRef, useEffect, ChangeEvent, DragEvent, useCallback } from "react";
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
  ExternalLink,
  Layers,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
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

export interface ScannedPanel {
  id: string;
  file: File;
  previewUrl: string;
  dataUrl?: string;
  label: string;
  results?: AnalysisResult | null;
  status: "idle" | "scanning" | "scanned" | "error";
  errorMessage?: string;
}

const DEFAULT_PANEL_LABELS = [
  "Front (PDP)",
  "Back (Declarations)",
  "Side / Nutrition",
  "Right Side",
  "Top / Base",
  "Detail / Barcode",
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\d]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Intelligent cross-panel synthesis:
 * - Excludes repetitive / duplicate declarations detected across multiple package images
 * - Combines and includes unique new statutory findings
 * - Prioritizes Passed findings over Failed findings for the same statutory rule
 */
function aggregateAndDeduplicateDeclarations(
  panels: ScannedPanel[],
  rawDetections: Detection[]
): {
  consolidated: Detection[];
  newItemsCount: number;
  excludedDuplicatesCount: number;
} {
  const coreCategories = [
    { cat: "MRP", rule: "LM-R6(1)(a)" },
    { cat: "Net Weight", rule: "LM-R6(1)(b)" },
    { cat: "Manufacture Date", rule: "LM-R6(1)(d)" },
    { cat: "Expire Date", rule: "LM-R6(1)(e)" },
    { cat: "Consumer Info", rule: "LM-R6(1)(g)" },
    { cat: "Manufacturer", rule: "LM-R6(1)(c)" },
  ];

  const consolidated: Detection[] = [];
  const processedCategoryNames = new Set<string>();
  let duplicatesExcluded = 0;
  let newItemsCount = 0;

  // Step 1: Process core Rule 6 statutory categories
  coreCategories.forEach(({ cat }) => {
    processedCategoryNames.add(cat.toLowerCase());

    const matching = rawDetections.filter(
      (d) => (d.category || "").toLowerCase() === cat.toLowerCase()
    );

    if (matching.length > 1) {
      duplicatesExcluded += matching.length - 1;
    }

    const passedMatches = matching.filter((d) => d.status === "Passed");
    if (passedMatches.length > 0) {
      // Pick the detection with the richest label
      const best = passedMatches.reduce((prev, curr) =>
        curr.label.length >= prev.label.length ? curr : prev
      );

      const panelsFound = Array.from(
        new Set(passedMatches.map((m) => m.panelLabel).filter(Boolean))
      );

      consolidated.push({
        ...best,
        panelLabel:
          panelsFound.length > 1
            ? `Verified on ${panelsFound.join(" & ")}`
            : best.panelLabel,
      });
      newItemsCount++;
    } else if (matching.length > 0) {
      // No passed finding: retain single failed declaration and discard duplicate error notices
      consolidated.push(matching[0]);
      newItemsCount++;
    } else {
      // Missing across all panels
      consolidated.push({
        category: cat,
        label: `Missing ${cat} declaration across all ${panels.length} inspected package images`,
        status: "Failed",
        box: { x: 0, y: 0, width: 0, height: 0 },
        panelLabel: "All Images",
        panelIndex: -1,
      });
      newItemsCount++;
    }
  });

  // Step 2: Include novel non-core findings (Barcodes, Licenses, Warnings) and exclude repetitive text
  const seenNormalizedLabels: string[] = [];

  rawDetections.forEach((d) => {
    const cat = (d.category || "").toLowerCase();
    if (processedCategoryNames.has(cat)) {
      return;
    }

    const norm = normalizeText(d.label);
    const isRepetitive = seenNormalizedLabels.some((existing) => {
      if (existing === norm) return true;
      if (norm.length > 12 && existing.length > 12) {
        if (existing.includes(norm) || norm.includes(existing)) return true;
      }
      return false;
    });

    if (isRepetitive) {
      duplicatesExcluded++;
    } else {
      seenNormalizedLabels.push(norm);
      consolidated.push(d);
      newItemsCount++;
    }
  });

  return {
    consolidated,
    newItemsCount,
    excludedDuplicatesCount: duplicatesExcluded,
  };
}

function createFallbackInspection(
  savedInspection: Inspection | undefined,
  productId: string,
  inspectorName: string | null | undefined,
  failedCount: number,
  complianceScore: number,
  detections: Detection[],
  imageUrl: string,
  imageUrls: string[]
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
    imageUrls,
    detections,
  };
}

export default function LiveInspectionScanner() {
  const { data: session } = useSession();

  const [panels, setPanels] = useState<ScannedPanel[]>([]);
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [currentScanningIndex, setCurrentScanningIndex] = useState<number | null>(null);

  const [aggregatedDetections, setAggregatedDetections] = useState<Detection[] | null>(null);
  const [dedupStats, setDedupStats] = useState<{
    newItems: number;
    duplicatesExcluded: number;
  } | null>(null);

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addPanelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkBackendHealth().then((online) => setBackendOnline(online));
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      panels.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
  }, [panels]);

  // Arrow key navigation between images
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (panels.length <= 1) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft") {
        setActivePanelIndex((prev) => (prev > 0 ? prev - 1 : panels.length - 1));
      } else if (e.key === "ArrowRight") {
        setActivePanelIndex((prev) => (prev < panels.length - 1 ? prev + 1 : 0));
      }
    },
    [panels.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        resolve(typeof ev.target?.result === "string" ? ev.target.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const handleIncomingFiles = (incomingFiles: FileList | File[]) => {
    const imageFiles = Array.from(incomingFiles).filter((f) =>
      f.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      setErrorMessage("Please upload valid image files (JPEG, PNG, WebP).");
      return;
    }

    setErrorMessage(null);

    const newPanels: ScannedPanel[] = imageFiles.map((file, idx) => {
      const existingCount = panels.length;
      const defaultLabel =
        DEFAULT_PANEL_LABELS[existingCount + idx] ||
        `Image ${existingCount + idx + 1}`;
      const preview = URL.createObjectURL(file);

      return {
        id: `panel-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        previewUrl: preview,
        label: defaultLabel,
        status: "idle",
      };
    });

    newPanels.forEach((p) => {
      fileToDataUrl(p.file).then((dUrl) => {
        p.dataUrl = dUrl;
      });
    });

    setPanels((prev) => {
      const updated = [...prev, ...newPanels];
      if (prev.length === 0 && imageFiles[0]) {
        const cleanName = imageFiles[0].name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        setProductNameInput(cleanName);
      }
      return updated;
    });

    setAggregatedDetections(null);
    setDedupStats(null);
    setSavedData(null);
  };

  const removePanel = (panelId: string) => {
    setPanels((prev) => {
      const target = prev.find((p) => p.id === panelId);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const filtered = prev.filter((p) => p.id !== panelId);
      if (activePanelIndex >= filtered.length) {
        setActivePanelIndex(Math.max(0, filtered.length - 1));
      }
      return filtered;
    });
    setAggregatedDetections(null);
    setDedupStats(null);
    setSavedData(null);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIncomingFiles(e.target.files);
    }
  };

  const onAddPanelChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIncomingFiles(e.target.files);
      // Switch to newly added image
      setTimeout(() => {
        setPanels((curr) => {
          if (curr.length > 0) setActivePanelIndex(curr.length - 1);
          return curr;
        });
      }, 50);
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIncomingFiles(e.dataTransfer.files);
    }
  };

  const runMultiImageScan = async () => {
    if (panels.length === 0) return;

    setIsScanning(true);
    setErrorMessage(null);

    const updatedPanels = [...panels];
    const allRawDetections: Detection[] = [];
    let detectedProdName = productNameInput;
    let detectedMfr = manufacturerInput;

    const heightVal = parseFloat(packageHeightInput);
    const parsedHeight = !isNaN(heightVal) && heightVal > 0 ? heightVal : undefined;

    try {
      for (let i = 0; i < updatedPanels.length; i++) {
        setCurrentScanningIndex(i);
        const panel = updatedPanels[i];
        panel.status = "scanning";
        setPanels([...updatedPanels]);

        try {
          const data = await analyzePackageImage(panel.file, parsedHeight);

          // Ignore missing Country of Origin unless imported
          const validDetections = (data.detections || []).filter((d) => {
            const cat = (d.category || "").toLowerCase();
            const lbl = (d.label || "").toLowerCase();
            const isCoO =
              cat.includes("country of origin") || lbl.includes("country of origin");
            const isErr =
              d.status === "Failed" ||
              lbl.includes("missing") ||
              lbl.includes("not visible");
            return !(isCoO && isErr);
          });

          // Tag with exact panel index for isolated coordinate overlay
          validDetections.forEach((d) => {
            d.panelLabel = panel.label;
            d.panelIndex = i;
          });

          data.detections = validDetections;
          data.panelLabel = panel.label;
          data.panelIndex = i;

          panel.results = data;
          panel.status = "scanned";

          if (!detectedProdName && data.product_name) {
            detectedProdName = data.product_name;
          }
          if (!detectedMfr && data.manufacturer) {
            detectedMfr = data.manufacturer;
          }

          allRawDetections.push(...validDetections);
        } catch (panelErr: any) {
          console.warn(`Panel scan error on ${panel.label}:`, panelErr);
          panel.status = "error";
          panel.errorMessage = panelErr.message || "Analysis error";
        }

        setPanels([...updatedPanels]);
      }

      // Deduplicate repetitive findings & include genuine new data
      const { consolidated, newItemsCount, excludedDuplicatesCount } =
        aggregateAndDeduplicateDeclarations(updatedPanels, allRawDetections);

      setAggregatedDetections(consolidated);
      setDedupStats({
        newItems: newItemsCount,
        duplicatesExcluded: excludedDuplicatesCount,
      });

      if (detectedProdName) setProductNameInput(detectedProdName);
      if (detectedMfr) setManufacturerInput(detectedMfr);

      // Collect data URLs for all panels
      const allPanelImageUrls: string[] = [];
      for (const p of updatedPanels) {
        let finalUrl = p.dataUrl;
        if (!finalUrl && p.file) {
          finalUrl = await fileToDataUrl(p.file);
          p.dataUrl = finalUrl;
        }
        allPanelImageUrls.push(finalUrl || p.previewUrl);
      }

      const primaryImageUrl = allPanelImageUrls[0] || "";

      // Auto-store to database and localStorage
      const saved = saveScannedInspection({
        productName: detectedProdName || "Packaged Commodity",
        manufacturer: detectedMfr || "Per Packaging Label",
        inspectorName: session?.user?.name || undefined,
        detections: consolidated,
        imageUrl: primaryImageUrl,
        imageUrls: allPanelImageUrls,
      });

      if (primaryImageUrl) {
        setCachedImage(saved.inspection.id, primaryImageUrl);
        saveImageToIDB(saved.inspection.id, primaryImageUrl);
      }

      setSavedData(saved);
    } catch (err: any) {
      const raw = err.message || "";
      if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
        setErrorMessage(
          "AI Inspection service is momentarily rate-limited by upstream Gemini quota. Please wait a few moments and retry."
        );
      } else if (raw.includes("503") || raw.includes("UNAVAILABLE")) {
        setErrorMessage(
          "Gemini Vision API is handling high traffic. Please retry in a few moments."
        );
      } else {
        setErrorMessage(
          raw || "Failed to communicate with AI vision engine. Ensure backend is running."
        );
      }
    } finally {
      setIsScanning(false);
      setCurrentScanningIndex(null);
    }
  };

  const handleGeneratePDF = async () => {
    if (panels.length === 0) return;

    const allPanelImageUrls: string[] = [];
    for (const p of panels) {
      let finalUrl = p.dataUrl;
      if (!finalUrl && p.file) {
        finalUrl = await fileToDataUrl(p.file);
      }
      allPanelImageUrls.push(finalUrl || p.previewUrl);
    }
    const primaryImageUrl = allPanelImageUrls[0] || "";
    const activeDetections = aggregatedDetections || [];

    const inspectionRecord: Inspection = createFallbackInspection(
      savedData?.inspection,
      savedData?.product?.id || "PRD-COMMODITY",
      session?.user?.name,
      failedCount,
      complianceScore,
      activeDetections,
      primaryImageUrl,
      allPanelImageUrls
    );

    const productRecord: Product = savedData?.product || {
      id: inspectionRecord.productId,
      name:
        productNameInput ||
        panels[0]?.results?.product_name ||
        panels[0]?.file.name ||
        "Packaged Commodity",
      category: "Packaged Commodity (PCR 2011)",
      manufacturer:
        manufacturerInput ||
        panels[0]?.results?.manufacturer ||
        "Per Label Declaration",
      mfgDate: "Per Label",
      expiryDate: "Per Label",
      batchNo: "Per Label Declaration",
      netQuantity: "Declared on Pack",
      mrp: 0,
      complianceStatus: failedCount > 0 ? "non-compliant" : "compliant",
    };

    const violationsList: Violation[] =
      savedData?.violations ||
      activeDetections
        .filter((d) => d.status === "Failed")
        .map((d, idx) => ({
          id: `VIOL-${idx + 1}`,
          inspectionId: inspectionRecord.id,
          ruleCode: d.category
            ? `LM-R6-${d.category.toUpperCase().replace(/\s+/g, "_")}`
            : "LM-R6(1)",
          ruleTitle: d.category || "Rule 6 Statutory Violation",
          description: d.label,
          severity: "critical" as const,
          remediation:
            "Rectify mandatory statutory declaration on package label under Rule 6.",
          status: "open" as const,
        }));

    generateInspectionPDF({
      inspection: inspectionRecord,
      product: productRecord,
      violations: violationsList,
    });
  };

  const resetAll = () => {
    panels.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    setPanels([]);
    setActivePanelIndex(0);
    setAggregatedDetections(null);
    setDedupStats(null);
    setSavedData(null);
    setErrorMessage(null);
    setProductNameInput("");
    setManufacturerInput("");
  };

  const activePanel = panels[activePanelIndex] || panels[0];

  const displayDetections: Detection[] =
    aggregatedDetections || activePanel?.results?.detections || [];

  const passedCount = displayDetections.filter((d) => d.status === "Passed").length;
  const failedCount = displayDetections.filter((d) => d.status === "Failed").length;
  const pendingCount = displayDetections.filter(
    (d) => d.status !== "Passed" && d.status !== "Failed"
  ).length;

  const complianceScore =
    displayDetections.length > 0
      ? Math.round(
          ((passedCount + pendingCount * 0.5) / displayDetections.length) * 100
        )
      : 100;

  const hasAnyScanned = panels.some((p) => p.status === "scanned");

  const goToPrevImage = () => {
    if (panels.length <= 1) return;
    setActivePanelIndex((prev) => (prev > 0 ? prev - 1 : panels.length - 1));
  };

  const goToNextImage = () => {
    if (panels.length <= 1) return;
    setActivePanelIndex((prev) => (prev < panels.length - 1 ? prev + 1 : 0));
  };

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
              {panels.length > 1 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-blue-600/20 text-blue-300 border-blue-500/30"
                >
                  {panels.length} Images Loaded
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multimodal Gemini 2.5 Flash neural vision • Deduplicated cross-panel compliance analysis
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

          {panels.length > 0 && (
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
        {panels.length === 0 ? (
          /* Step 1: Upload Dropzone (Multi-Image Support) */
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
                Upload photographs of the product packaging. You can upload <strong>multiple angles</strong> (e.g. Front, Back, and Side panels). The engine automatically correlates declarations, <strong>excludes repetitive duplicate text</strong>, and aggregates all new statutory data.
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
                multiple
                className="hidden"
                onChange={onFileInputChange}
              />

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-blue-400 mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-blue-950/40">
                <UploadCloud className="w-10 h-10" />
              </div>

              <h4 className="text-base font-semibold text-slate-200">
                Drag and drop package photos here (Single or Multiple)
              </h4>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                Upload Front, Back, Nutritional, and Side panel scans together (JPG, PNG, WEBP)
              </p>

              <Button variant="default" size="default" className="shadow-blue-600/30">
                <UploadCloud className="w-4 h-4 mr-1.5" />
                Select Packaging Photos
              </Button>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
                  Front Panel (PDP)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
                  Back Panel (MRP &amp; Dates)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
                  Side (Consumer Care / Barcode)
                </span>
              </div>
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
          /* Step 2: Single-Image Focus Workspace with Arrow-Type Page Switching */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full min-h-[calc(100vh-120px)]">
            {/* Left Panel: Focused Single Image with Arrow Navigation Controls */}
            <div className="bg-slate-950 flex flex-col p-6 border-r border-slate-800/80 relative overflow-hidden">
              {/* Arrow-type Page Switching Bar */}
              <div className="mb-4 flex items-center justify-between p-2.5 px-3.5 bg-slate-900/90 border border-slate-800/90 rounded-2xl backdrop-blur-xl shadow-lg">
                {/* Arrow Page Switcher */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={panels.length <= 1}
                    onClick={goToPrevImage}
                    className="h-8 w-8 p-0 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80"
                    title="Previous Image (Left Arrow key)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-mono font-bold text-slate-200">
                      Image {activePanelIndex + 1} of {panels.length}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-semibold text-blue-300">
                      {activePanel?.label}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={panels.length <= 1}
                    onClick={goToNextImage}
                    className="h-8 w-8 p-0 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80"
                    title="Next Image (Right Arrow key)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Add More Photos & Delete Active Photo Action Buttons */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={addPanelInputRef}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onAddPanelChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addPanelInputRef.current?.click()}
                    className="h-8 px-2.5 text-xs text-blue-300 border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Photo</span>
                  </Button>

                  {panels.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePanel(activePanel.id)}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Remove current image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Trigger Bar if not analyzed yet */}
              {!hasAnyScanned && !isScanning && (
                <div className="mb-4 flex items-center justify-between p-3.5 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-xl">
                  <div>
                    <p className="text-xs font-semibold text-slate-100">
                      {panels.length > 1
                        ? `${panels.length} Images Ready for Deduplicated Audit`
                        : activePanel?.file.name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {panels.length > 1
                        ? "Filters out duplicates and synthesizes all statutory declarations"
                        : "Ready for automated rule verification"}
                    </p>
                  </div>
                  <Button
                    variant="default"
                    size="default"
                    onClick={runMultiImageScan}
                    className="shadow-blue-600/30 text-xs"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    <span>
                      {panels.length > 1 ? `Analyze All ${panels.length} Images` : "Run AI Analysis"}
                    </span>
                  </Button>
                </div>
              )}

              {/* Scanning Laser Sweep Effect */}
              {isScanning && (
                <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
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
                  <p className="text-blue-400 text-xs font-semibold mt-1">
                    {currentScanningIndex !== null && panels[currentScanningIndex]
                      ? `Analyzing Image ${currentScanningIndex + 1} of ${panels.length}: ${panels[currentScanningIndex].label}`
                      : "Processing Gemini vision stream..."}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-2 font-mono">
                    Cross-checking panels &amp; filtering out repetitive declarations
                  </p>
                </div>
              )}

              {/* Focused Active Single Image Stage with Floating Arrows */}
              {activePanel && (
                <div className="relative flex-1 flex flex-col items-center justify-center min-h-[460px] group">
                  {/* Floating Left Arrow */}
                  {panels.length > 1 && (
                    <button
                      onClick={goToPrevImage}
                      className="absolute left-2 z-30 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl opacity-60 group-hover:opacity-100 transition-opacity"
                      title="Previous Image (←)"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}

                  {/* Active Single Image Bounding Box Viewer */}
                  <BackendBoundingBoxViewer
                    imageUrl={activePanel.previewUrl}
                    results={activePanel.results || null}
                    panelLabel={activePanel.label}
                  />

                  {/* Floating Right Arrow */}
                  {panels.length > 1 && (
                    <button
                      onClick={goToNextImage}
                      className="absolute right-2 z-30 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl opacity-60 group-hover:opacity-100 transition-opacity"
                      title="Next Image (→)"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel: Non-Repetitive Synthesis & Rule Checklist */}
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
                      {productNameInput || (panels.length > 1 ? `${panels.length}-Panel Packaged Commodity` : panels[0]?.file.name)}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {hasAnyScanned
                        ? `${panels.length} image${panels.length > 1 ? "s" : ""} analyzed • ${displayDetections.length} deduplicated declarations verified`
                        : `${panels.length} image${panels.length > 1 ? "s" : ""} loaded • Awaiting analysis`}
                    </p>
                  </div>

                  <Badge
                    variant={
                      hasAnyScanned
                        ? failedCount > 0
                          ? "destructive"
                          : "success"
                        : "secondary"
                    }
                  >
                    {hasAnyScanned
                      ? failedCount > 0
                        ? "VIOLATIONS DETECTED"
                        : "COMPLIANT"
                      : "READY TO AUDIT"}
                  </Badge>
                </div>

                {/* Deduplication Summary Pill */}
                {dedupStats && dedupStats.duplicatesExcluded > 0 && (
                  <div className="mb-4 flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                    <Filter className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      Excluded <strong>{dedupStats.duplicatesExcluded} repetitive item{dedupStats.duplicatesExcluded > 1 ? "s" : ""}</strong> across images. Retained unique statutory declarations.
                    </span>
                  </div>
                )}

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

                {/* Re-trigger Scan if more panels added */}
                {hasAnyScanned && !isScanning && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Added another angle? Re-run to update combined compliance.
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={runMultiImageScan}
                      className="text-xs gap-1.5 text-blue-300 border-blue-500/30"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Re-Analyze All Images</span>
                    </Button>
                  </div>
                )}

                {/* Auto-Stored to Database & PDF Certificate CTA */}
                {hasAnyScanned && savedData && (
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
                                  prev
                                    ? {
                                        ...prev,
                                        product: { ...prev.product, name: val },
                                      }
                                    : null
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
                                  prev
                                    ? {
                                        ...prev,
                                        product: {
                                          ...prev.product,
                                          manufacturer: val,
                                        },
                                      }
                                    : null
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

                {hasAnyScanned && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const exportPayload = {
                        commodity: productNameInput,
                        manufacturer: manufacturerInput,
                        panels_count: panels.length,
                        duplicates_excluded: dedupStats?.duplicatesExcluded || 0,
                        unique_findings: displayDetections.length,
                        panels: panels.map((p) => ({
                          label: p.label,
                          status: p.status,
                          detections: p.results?.detections || [],
                        })),
                        consolidated_detections: displayDetections,
                      };
                      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `compliance-${productNameInput || "product"}.json`;
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
                {hasAnyScanned ? (
                  displayDetections.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
                      No text detected with high confidence across uploaded images. Ensure package photos are well-lit and text is legible.
                    </div>
                  ) : (
                    displayDetections.map((detection, index) => {
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
                        ruleCodeMap[categoryKey] ||
                        `LM-OCR-${String(index + 1).padStart(3, "0")}`;

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

                      const detectionPanelIndex = detection.panelIndex;
                      const detectionPanelLabel = detection.panelLabel;

                      return (
                        <div key={index} className="relative group">
                          {detectionPanelLabel && detectionPanelIndex !== undefined && detectionPanelIndex >= 0 && (
                            <button
                              onClick={() => {
                                if (
                                  detectionPanelIndex >= 0 &&
                                  detectionPanelIndex < panels.length
                                ) {
                                  setActivePanelIndex(detectionPanelIndex);
                                }
                              }}
                              className="absolute top-3.5 right-12 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 text-[10px] font-semibold border border-blue-500/30 transition-colors"
                              title={`Switch viewer to ${detectionPanelLabel}`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>{detectionPanelLabel}</span>
                            </button>
                          )}
                          <AccordionCard
                            ruleCode={assignedRuleCode}
                            title={
                              categoryKey
                                ? `${categoryKey} — ${ruleMessage}`
                                : ruleMessage
                            }
                            severity={severityType}
                            status={statusType}
                            description={
                              detection.box && detection.box.width > 0
                                ? `OCR bounding box coordinates: [x:${detection.box.x}, y:${detection.box.y}, width:${detection.box.width}px, height:${detection.box.height}px].`
                                : `Synthesized across ${panels.length} uploaded packaging images.`
                            }
                            extractedValue={extractedText}
                            expectedValue={
                              isFailed
                                ? "Mandatory declaration under Legal Metrology (Packaged Commodities) Rules, 2011"
                                : undefined
                            }
                            remediation={undefined}
                            defaultOpen={false}
                          />
                        </div>
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
                      Click &ldquo;Analyze All {panels.length} Images&rdquo; to execute the deduplicated Legal Metrology vision pipeline.
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
