"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
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
  Sparkles,
  CameraOff,
  ScanSearch,
  Scale,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { AccordionCard } from "@/components/AccordionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateInspectionPDF } from "@/lib/pdfGenerator";
import StatutoryNoticeModal from "@/components/StatutoryNoticeModal";
import {
  Inspection,
  Product,
  Violation,
  normalizeImageUrl,
} from "@/lib/inspectionsStore";
import { getImageFromIDB } from "@/lib/idb";

interface InspectionAuditViewProps {
  inspection: Inspection;
  product?: Product;
  violations?: Violation[];
}

export default function InspectionAuditView({
  inspection,
  product: rawProduct,
  violations = [],
}: InspectionAuditViewProps) {
  const product: Product = rawProduct || {
    id: inspection?.productId || "PRD-DEFAULT",
    name: "Packaged Commodity",
    category: "Packaged Goods (PCR 2011)",
    manufacturer: "Per Packaging Label",
    mfgDate: "Per Label",
    expiryDate: "Per Label",
    batchNo: "Per Label",
    netQuantity: "Declared on Pack",
    mrp: 0,
    complianceStatus: "compliant",
  };
  const [showBoxes, setShowBoxes] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredBox, setHoveredBox] = useState<any | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 800,
  });
  const [displayImgUrl, setDisplayImgUrl] = useState<string>(
    normalizeImageUrl(inspection.imageUrl || "")
  );
  const [imgLoadFailed, setImgLoadFailed] = useState<boolean>(false);
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayImgUrl(normalizeImageUrl(inspection.imageUrl || ""));
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
    const match = displayImgUrl.match(/\/uploads\/([^\/\?#]+)$/);
    if (match && displayImgUrl !== `/uploads/${match[1]}`) {
      setDisplayImgUrl(`/uploads/${match[1]}`);
      return;
    }

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

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 select-none">
      <Sidebar />
      <main className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        <TopBar
          title="Inspection Audit & Verification"
          subtitle={`${product.name} • ${inspection.id} • ${inspection.location}`}
        />

        <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
          {/* Left Panel: High-Resolution Image Viewer with Bounding Boxes */}
          <div className="col-span-7 relative bg-slate-950 border-r border-slate-800/80 flex flex-col h-full overflow-hidden">
            {/* Top Toolbar Bar */}
            <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between z-20">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Product Package Label &amp; Spatial Coordinate Map</span>
                <Badge variant="default" className="text-[10px] font-mono">
                  {hasLiveDetections
                    ? `${inspection.detections?.length} Live OCR Boxes`
                    : "5 Rule Overlays"}
                </Badge>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/60 rounded-xl p-1 shadow-lg">
                <button
                  onClick={() => setShowBoxes(!showBoxes)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    showBoxes
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-200"
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

                <div className="w-px h-4 bg-slate-700/60 mx-1" />

                <button
                  onClick={handleZoomIn}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleZoomOut}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleResetZoom}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <span className="text-[10px] font-mono text-slate-400 px-1.5">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>
            </div>

            {/* Main Stage: Image with Visual Bounding Boxes */}
            <div
              ref={imageContainerRef}
              className="flex-1 overflow-auto p-6 flex items-center justify-center relative bg-gradient-to-b from-slate-950 via-slate-900/20 to-slate-950"
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
                  <div className="relative inline-block w-fit max-w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        const boxX = det.boxX !== undefined ? det.boxX : (det.box?.x ?? 0);
                        const boxY = det.boxY !== undefined ? det.boxY : (det.box?.y ?? 0);
                        const boxW = det.boxWidth !== undefined ? det.boxWidth : (det.box?.width ?? 0);
                        const boxH = det.boxHeight !== undefined ? det.boxHeight : (det.box?.height ?? 0);

                        if (boxW <= 0 || boxH <= 0 || (boxX === 0 && boxY === 0 && boxW === 0)) {
                          return null;
                        }

                        let scaleW = 1000;
                        let scaleH = 1000;
                        if (boxX > 1000 || boxY > 1000 || boxW > 1000 || boxH > 1000) {
                          scaleW = naturalSize.width || 1000;
                          scaleH = naturalSize.height || 1000;
                        } else if (boxX === 50 && boxW === 300) {
                          scaleW = 800;
                          scaleH = 800;
                        }

                        const leftPercent = Math.max(0, Math.min(100, (boxX / scaleW) * 100));
                        const topPercent = Math.max(0, Math.min(100, (boxY / scaleH) * 100));
                        const widthPercent = Math.max(1, Math.min(100 - leftPercent, (boxW / scaleW) * 100));
                        const heightPercent = Math.max(1, Math.min(100 - topPercent, (boxH / scaleH) * 100));

                        const isPassed = det.status === "Passed";
                        const isNearTop = topPercent < 5;
                        const isHovered = hoveredBox === det || hoveredBox?.category === det.category;

                        return (
                          <div
                            key={det.id || idx}
                            onMouseEnter={() => setHoveredBox(det)}
                            onMouseLeave={() => setHoveredBox(null)}
                            className={`absolute border-2 border-dashed rounded-md cursor-pointer transition-all duration-150 ${
                              isHovered ? "z-30 ring-2 ring-blue-400/80 shadow-lg" : "z-20"
                            } ${
                              isPassed
                                ? "border-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25"
                                : "border-red-500 bg-red-500/15 hover:bg-red-500/25"
                            }`}
                            style={{
                              left: `${leftPercent}%`,
                              top: `${topPercent}%`,
                              width: `${widthPercent}%`,
                              height: `${heightPercent}%`,
                            }}
                          >
                            <span
                              className={`absolute ${
                                isNearTop ? "-bottom-6" : "-top-6"
                              } left-0 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-30 transition-opacity ${
                                isHovered ? "opacity-100" : "opacity-85"
                              } ${
                                isPassed
                                  ? "bg-emerald-600 text-white"
                                  : "bg-red-600 text-white"
                              }`}
                            >
                              {det.category || `Box #${idx + 1}`}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
                      <CameraOff className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-100 mb-1">
                      No Packaging Photo Attached
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      This statutory record was registered without a high-resolution packaging photo. Upload a product label scan to enable optical declaration bounding box verification.
                    </p>
                    <Link href="/scan">
                      <Button size="sm" variant="default" className="gap-2 shadow-blue-600/30">
                        <ScanSearch className="w-4 h-4" />
                        <span>Run Live Label Scan</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Floating Tooltip when hovering over a Bounding Box */}
              <AnimatePresence>
                {hoveredBox && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-6 left-6 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 p-3.5 rounded-xl shadow-2xl max-w-sm"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-xs font-bold text-slate-100">
                        {hoveredBox.category || "Statutory Declaration"}
                      </span>
                      <Badge
                        variant={hoveredBox.status === "Passed" ? "success" : "destructive"}
                        className="text-[10px]"
                      >
                        {hoveredBox.status}
                      </Badge>
                    </div>
                    <p className="text-slate-300 font-mono text-xs break-words">
                      {hoveredBox.label}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel: Statutory Rule Checklist & Inspection Details */}
          <div className="col-span-5 bg-slate-900/30 overflow-y-auto p-6 flex flex-col gap-6 h-full">
            {/* Header Product Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="liquid-glass-card rounded-2xl p-5 shadow-xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-slate-100 font-bold text-base leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {product.manufacturer}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      generateInspectionPDF({ inspection, product, violations })
                    }
                    className="shadow-blue-600/30 text-xs gap-1"
                    title="Generate and Download Official PDF Certificate"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF Report</span>
                  </Button>

                  <Badge
                    variant={
                      violations.length === 0
                        ? "success"
                        : "destructive"
                    }
                    className="text-xs uppercase"
                  >
                    {violations.length === 0
                      ? "COMPLIANT"
                      : `${violations.length} VIOLATION${violations.length > 1 ? "S" : ""}`}
                  </Badge>
                </div>
              </div>

              {/* Inspection Details Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs pt-3 border-t border-slate-800/80">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <p className="text-slate-500 text-[10px] uppercase font-semibold">
                    Inspection ID
                  </p>
                  <p className="text-blue-400 font-mono font-bold mt-0.5">
                    {inspection.id}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <p className="text-slate-500 text-[10px] uppercase font-semibold">
                    Batch / Lot No
                  </p>
                  <p className="text-slate-300 font-mono font-medium mt-0.5">
                    {product.batchNo}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <p className="text-slate-500 text-[10px] uppercase font-semibold">
                    Enforcement Officer
                  </p>
                  <p className="text-slate-300 font-medium mt-0.5">
                    {inspection.inspector}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <p className="text-slate-500 text-[10px] uppercase font-semibold">
                    Audit Date &amp; Zone
                  </p>
                  <p className="text-slate-300 font-medium mt-0.5 truncate">
                    {inspection.date} • {inspection.location}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Live Detected Statutory Declarations */}
            {hasLiveDetections && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Detected Declarations ({inspection.detections?.length})
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Hover to highlight on photo
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {inspection.detections?.map((det: any, idx: number) => {
                    const isPassed = det.status === "Passed";
                    const isHovered = hoveredBox === det || hoveredBox?.category === det.category;
                    return (
                      <div
                        key={det.id || idx}
                        onMouseEnter={() => setHoveredBox(det)}
                        onMouseLeave={() => setHoveredBox(null)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isHovered
                            ? "bg-slate-800/90 border-blue-500/50 shadow-lg shadow-blue-950/40"
                            : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-850"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-200">
                            {det.category || "Declaration"}
                          </span>
                          <Badge
                            variant={isPassed ? "success" : "destructive"}
                            className="text-[10px]"
                          >
                            {det.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-mono line-clamp-2">
                          {det.label || "No text extracted"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Checklist Section Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <FileCheck className="w-4 h-4 text-blue-400" />
                <span>Statutory Rule Verification</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                PCR 2011 Rule 6
              </span>
            </div>

            {/* Violations or Statutory Checks Accordion */}
            <div className="space-y-2.5">
              {violations.length === 0 ? (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>All Mandatory Declarations Fully Compliant</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    This packaged commodity complies with all statutory declarations
                    under Rule 6 of the Legal Metrology (Packaged Commodities)
                    Rules, 2011. MRP inclusive of taxes, net quantity standard units,
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
              <div className="p-4 rounded-2xl liquid-glass-card shadow-xl flex items-center justify-between">
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase block text-[10px] font-semibold">
                      Pass
                    </span>
                    <span className="text-emerald-400 font-bold font-mono text-base">
                      {Math.max(5 - violations.length, 0)}
                    </span>
                  </div>
                  <div className="w-px h-7 bg-slate-800" />
                  <div>
                    <span className="text-slate-500 uppercase block text-[10px] font-semibold">
                      Violations
                    </span>
                    <span className="text-red-400 font-bold font-mono text-base">
                      {violations.length}
                    </span>
                  </div>
                  <div className="w-px h-7 bg-slate-800" />
                  <div>
                    <span className="text-slate-500 uppercase block text-[10px] font-semibold">
                      Score
                    </span>
                    <span className="text-slate-100 font-bold font-mono text-base">
                      {inspection.complianceScore || compliancePercentage}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {violations.length > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowNoticeModal(true)}
                      className="bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 text-xs gap-1.5"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Issue Statutory Notice</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      generateInspectionPDF({ inspection, product, violations })
                    }
                    className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-100 text-xs gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Certificate</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <StatutoryNoticeModal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        inspection={inspection}
        product={product}
        violations={violations}
      />
    </div>
  );
}
