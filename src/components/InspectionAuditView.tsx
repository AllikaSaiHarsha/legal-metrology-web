"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  Layers,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { AccordionCard } from "@/components/AccordionCard";
import { generateInspectionPDF } from "@/lib/pdfGenerator";
import PackageLabelMockup from "./PackageLabelMockup";
import { Inspection, Product, Violation } from "@/lib/inspectionsStore";
import { getImageFromIDB } from "@/lib/idb";

interface InspectionAuditViewProps {
  inspection: Inspection;
  product: Product;
  violations: Violation[];
}

export default function InspectionAuditView({
  inspection,
  product,
  violations,
}: InspectionAuditViewProps) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredBox, setHoveredBox] = useState<any | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 800,
  });
  const [displayImgUrl, setDisplayImgUrl] = useState<string>(inspection.imageUrl || "");
  const [imgLoadFailed, setImgLoadFailed] = useState<boolean>(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayImgUrl(inspection.imageUrl || "");
    setImgLoadFailed(false);

    if (inspection.id) {
      getImageFromIDB(inspection.id).then((idbImg) => {
        if (idbImg) {
          setDisplayImgUrl(idbImg);
          setImgLoadFailed(false);
        }
      });
    }
  }, [inspection.id, inspection.imageUrl]);

  const handleImgError = async () => {
    if (inspection.id && !displayImgUrl.startsWith("data:image")) {
      const idbImg = await getImageFromIDB(inspection.id);
      if (idbImg && idbImg !== displayImgUrl) {
        setDisplayImgUrl(idbImg);
        return;
      }
    }
    setImgLoadFailed(true);
  };

  const isRealUploadedImage =
    !imgLoadFailed &&
    Boolean(displayImgUrl) &&
    displayImgUrl.trim().length > 0 &&
    !displayImgUrl.includes("placeholder-label") &&
    !displayImgUrl.startsWith("__idb__") &&
    !displayImgUrl.startsWith("__session__");

  // Extract or synthesize bounding boxes for the 5 Legal Metrology categories
  const hasLiveDetections =
    inspection.detections && inspection.detections.length > 0;

  const passCount = violations.filter((v) => v.status === "resolved").length;
  const failCount = violations.filter((v) => v.status === "open").length;
  const warningCount = violations.filter((v) => v.status === "under-review").length;

  const compliancePercentage =
    violations.length === 0
      ? 100
      : Math.max(
          10,
          Math.round(
            ((passCount + warningCount * 0.5) /
              Math.max(violations.length, 1)) *
              100
          )
        );

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // Synthetic fallback boxes aligned with PackageLabelMockup
  const syntheticBoxes = [
    {
      id: "box-net-qty",
      category: "Net Weight",
      ruleCode: "LM-R6(1)(b)",
      status: violations.some(
        (v) => v.ruleCode.includes("6(1)(b)") || v.ruleTitle.includes("Net")
      )
        ? "Failed"
        : "Passed",
      label: `Net Quantity: ${product.netQuantity}`,
      left: 6,
      top: 31,
      width: 88,
      height: 9,
    },
    {
      id: "box-mrp",
      category: "MRP",
      ruleCode: "LM-R6(1)(a)",
      status: violations.some(
        (v) => v.ruleCode.includes("6(1)(a)") || v.ruleTitle.includes("MRP")
      )
        ? "Failed"
        : "Passed",
      label: `MRP: Rs. ${product.mrp.toFixed(2)} (Incl. of all taxes)`,
      left: 6,
      top: 41.5,
      width: 88,
      height: 10,
    },
    {
      id: "box-mfg-date",
      category: "Manufacture Date",
      ruleCode: "LM-R6(1)(d)",
      status: violations.some(
        (v) =>
          v.ruleCode.includes("6(1)(d)") ||
          v.ruleTitle.includes("Manufacture")
      )
        ? "Failed"
        : "Passed",
      label: `Mfg Date: ${product.mfgDate}`,
      left: 6,
      top: 53,
      width: 42,
      height: 9,
    },
    {
      id: "box-exp-date",
      category: "Expire Date",
      ruleCode: "LM-R6(1)(e)",
      status: violations.some(
        (v) => v.ruleCode.includes("6(1)(e)") || v.ruleTitle.includes("Expire")
      )
        ? "Failed"
        : "Passed",
      label: `Best Before: ${product.expiryDate || "12 Months"}`,
      left: 6,
      top: 63.5,
      width: 88,
      height: 8.5,
    },
    {
      id: "box-consumer-care",
      category: "Consumer Info",
      ruleCode: "LM-R6(1)(g)",
      status: violations.some(
        (v) =>
          v.ruleCode.includes("6(1)(g)") || v.ruleTitle.includes("Consumer")
      )
        ? "Failed"
        : "Passed",
      label: `Consumer Helpline: 1800-22-1111`,
      left: 6,
      top: 73.5,
      width: 88,
      height: 8.5,
    },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        <TopBar
          title="Inspection Audit & Verification"
          subtitle={`${product.name} • ${inspection.id} • ${inspection.location}`}
        />

        <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
          {/* Left Panel: High-Resolution Image Viewer with Bounding Boxes */}
          <div className="col-span-7 relative bg-zinc-950/80 border-r border-white/[0.06] flex flex-col h-full overflow-hidden">
            {/* Top Toolbar Bar */}
            <div className="p-4 border-b border-white/[0.06] bg-zinc-900/40 backdrop-blur-md flex items-center justify-between z-20">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Product Package Label & OCR Overlay</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {hasLiveDetections
                    ? `${inspection.detections?.length} Live OCR Boxes`
                    : "5 Statutory Rule Overlays"}
                </span>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-white/10 rounded-xl p-1 shadow-lg">
                <button
                  onClick={() => setShowBoxes(!showBoxes)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    showBoxes
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title={showBoxes ? "Hide Bounding Boxes" : "Show Bounding Boxes"}
                >
                  {showBoxes ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  <span>{showBoxes ? "Boxes Visible" : "Boxes Hidden"}</span>
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <span className="text-[10px] font-mono text-zinc-400 px-1.5">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>
            </div>

            {/* Main Stage: Image with Visual Bounding Boxes */}
            <div
              ref={imageContainerRef}
              className="flex-1 overflow-auto p-6 flex items-center justify-center relative bg-gradient-to-b from-zinc-950 via-zinc-900/30 to-zinc-950"
            >
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
                className="relative max-w-full flex items-center justify-center"
              >
                {/* Real Uploaded Photo */}
                {isRealUploadedImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
                    <img
                      src={displayImgUrl}
                      alt={product.name}
                      onLoad={(e) => {
                        setNaturalSize({
                          width: e.currentTarget.naturalWidth || 800,
                          height: e.currentTarget.naturalHeight || 800,
                        });
                      }}
                      onError={handleImgError}
                      className="max-h-[580px] w-auto object-contain block select-none"
                    />

                    {/* Live Bounding Boxes on Real Image */}
                    {showBoxes &&
                      hasLiveDetections &&
                      inspection.detections?.map((det: any, idx) => {
                        const boxX = det.boxX !== undefined ? det.boxX : (det.box?.x || 0);
                        const boxY = det.boxY !== undefined ? det.boxY : (det.box?.y || 0);
                        const boxW = det.boxWidth !== undefined ? det.boxWidth : (det.box?.width || 0);
                        const boxH = det.boxHeight !== undefined ? det.boxHeight : (det.box?.height || 0);

                        const leftPercent = (boxX / naturalSize.width) * 100;
                        const topPercent = (boxY / naturalSize.height) * 100;
                        const widthPercent = (boxW / naturalSize.width) * 100;
                        const heightPercent = (boxH / naturalSize.height) * 100;

                        const isPassed = det.status === "Passed";

                        return (
                          <div
                            key={idx}
                            onMouseEnter={() => setHoveredBox(det)}
                            onMouseLeave={() => setHoveredBox(null)}
                            className={`absolute border-2 border-dashed rounded-md cursor-pointer transition-all duration-150 z-20 ${
                              isPassed
                                ? "border-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25"
                                : "border-rose-500 bg-rose-500/15 hover:bg-rose-500/25"
                            }`}
                            style={{
                              left: `${leftPercent}%`,
                              top: `${topPercent}%`,
                              width: `${Math.max(widthPercent, 2)}%`,
                              height: `${Math.max(heightPercent, 2)}%`,
                            }}
                          >
                            <div
                              className={`absolute -top-3 left-0 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow text-white whitespace-nowrap ${
                                isPassed ? "bg-emerald-600" : "bg-rose-600"
                              }`}
                            >
                              {det.category || det.status}: {det.status}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  /* High-Fidelity Package Label Canvas for Seeded Inspections / Fallback */
                  <div className="relative w-[420px]">
                    {imgLoadFailed && (
                      <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5 shadow-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Remote photo snapshot expired • Displaying high-fidelity digital statutory reconstruction</span>
                      </div>
                    )}
                    <PackageLabelMockup
                      product={product}
                      inspection={inspection}
                    />

                    {/* Synthetic Bounding Boxes Aligned over Mockup */}
                    {showBoxes &&
                      syntheticBoxes.map((box) => {
                        const isPassed = box.status === "Passed";

                        return (
                          <div
                            key={box.id}
                            onMouseEnter={() => setHoveredBox(box)}
                            onMouseLeave={() => setHoveredBox(null)}
                            className={`absolute border-2 border-dashed rounded-lg cursor-pointer transition-all duration-150 z-20 ${
                              isPassed
                                ? "border-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/25"
                                : "border-rose-500 bg-rose-500/20 hover:bg-rose-500/30"
                            }`}
                            style={{
                              left: `${box.left}%`,
                              top: `${box.top}%`,
                              width: `${box.width}%`,
                              height: `${box.height}%`,
                            }}
                          >
                            <div
                              className={`absolute -top-3 left-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow text-white whitespace-nowrap ${
                                isPassed ? "bg-emerald-600" : "bg-rose-600"
                              }`}
                            >
                              {box.category}: {box.status}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Hover Floating Information Tooltip */}
              <AnimatePresence>
                {hoveredBox && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute top-6 left-6 right-6 z-30 bg-zinc-950/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 text-xs shadow-2xl pointer-events-none"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          hoveredBox.status === "Passed"
                            ? "bg-emerald-400"
                            : "bg-rose-500"
                        }`}
                      />
                      <span className="font-bold text-zinc-100 uppercase tracking-wide">
                        {hoveredBox.category || hoveredBox.ruleCode || "Declaration"}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          hoveredBox.status === "Passed"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {hoveredBox.status}
                      </span>
                    </div>
                    <p className="text-zinc-300 font-mono text-xs break-words">
                      {hoveredBox.label}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel: Statutory Rule Checklist & Inspection Details */}
          <div className="col-span-5 bg-zinc-900/40 overflow-y-auto p-6 flex flex-col gap-6 h-full">
            {/* Header Product Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-800/40 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 shadow-xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-zinc-100 font-bold text-lg leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    {product.manufacturer}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      generateInspectionPDF({ inspection, product, violations })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all hover:scale-[1.02]"
                    title="Generate and Download Official PDF Certificate"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF Report</span>
                  </button>

                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      inspection.status === "completed"
                        ? violations.length === 0
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {violations.length === 0
                      ? "COMPLIANT"
                      : `${violations.length} VIOLATION${violations.length > 1 ? "S" : ""}`}
                  </div>
                </div>
              </div>

              {/* Inspection Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-white/[0.06]">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-zinc-500 text-[10px] uppercase font-semibold">
                    Inspection ID
                  </p>
                  <p className="text-indigo-300 font-mono font-bold mt-0.5">
                    {inspection.id}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-zinc-500 text-[10px] uppercase font-semibold">
                    Batch / Lot No
                  </p>
                  <p className="text-zinc-300 font-mono font-medium mt-0.5">
                    {product.batchNo}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-zinc-500 text-[10px] uppercase font-semibold">
                    Enforcement Officer
                  </p>
                  <p className="text-zinc-300 font-medium mt-0.5">
                    {inspection.inspector}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-zinc-500 text-[10px] uppercase font-semibold">
                    Audit Date & Zone
                  </p>
                  <p className="text-zinc-300 font-medium mt-0.5">
                    {inspection.date} • {inspection.location}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Checklist Section Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                <span>Statutory Rule Verification</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Legal Metrology Rules, 2011
              </span>
            </div>

            {/* Violations or Statutory Checks Accordion */}
            <div className="space-y-3">
              {violations.length === 0 ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>All Mandatory Declarations Fully Compliant</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    This packaged commodity complies with all statutory declarations
                    under Rule 6 of the Legal Metrology (Packaged Commodities)
                    Rules, 2011. MRP inclusive of taxes, net weight standard units,
                    date of packing, expiry period, and consumer helpline are all
                    validly declared.
                  </p>
                </div>
              ) : (
                violations.map((v, index) => {
                  let status: "pass" | "fail" | "warning" = "fail";
                  if (v.status === "resolved") status = "pass";
                  if (v.status === "under-review") status = "warning";

                  return (
                    <AccordionCard
                      key={v.id || index}
                      ruleCode={v.ruleCode}
                      title={v.ruleTitle}
                      severity={v.severity}
                      status={status}
                      description={v.description}
                      remediation={v.remediation}
                      defaultOpen={index === 0}
                    />
                  );
                })
              )}
            </div>

            {/* Bottom KPI Bar */}
            <div className="mt-auto pt-4">
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/[0.08] shadow-xl flex items-center justify-between">
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-zinc-500 uppercase block text-[10px]">
                      Pass
                    </span>
                    <span className="text-emerald-400 font-bold font-mono text-base">
                      {Math.max(5 - violations.length, 0)}
                    </span>
                  </div>
                  <div className="w-px h-7 bg-white/[0.08]" />
                  <div>
                    <span className="text-zinc-500 uppercase block text-[10px]">
                      Violations
                    </span>
                    <span className="text-rose-400 font-bold font-mono text-base">
                      {violations.length}
                    </span>
                  </div>
                  <div className="w-px h-7 bg-white/[0.08]" />
                  <div>
                    <span className="text-zinc-500 uppercase block text-[10px]">
                      Score
                    </span>
                    <span className="text-zinc-100 font-bold font-mono text-base">
                      {inspection.complianceScore || compliancePercentage}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    generateInspectionPDF({ inspection, product, violations })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Certificate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
