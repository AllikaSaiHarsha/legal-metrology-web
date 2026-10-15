"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Layers } from "lucide-react";
import { AnalysisResult, Detection } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface Props {
  imageUrl: string;
  results: AnalysisResult | null;
  panelLabel?: string;
}

export default function BackendBoundingBoxViewer({ imageUrl, results, panelLabel }: Props) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [hoveredDetection, setHoveredDetection] = useState<Detection | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 select-none">
      {/* Viewer Box (Liquid Glass frame) */}
      <div className="relative w-full max-w-xl max-h-[620px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
        {panelLabel && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-[11px] font-semibold text-slate-200 shadow-xl">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>{panelLabel}</span>
          </div>
        )}

        {/* Precision coordinate grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div
          className="relative transition-transform duration-200 ease-out inline-block w-fit h-fit max-h-[560px]"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Scanned Package Label"
            className="max-h-[540px] max-w-full w-auto object-contain rounded-xl block pointer-events-none select-none"
          />

          {/* Bounding Box Overlays */}
          <AnimatePresence>
            {showBoxes &&
              results &&
              results.detections &&
              results.detections.map((detection, index) => {
                const box = detection.box;
                if (!box || (box.width <= 0 && box.height <= 0) || (box.x === 0 && box.y === 0 && box.width === 0)) {
                  return null;
                }

                const origW = results.original_width || 1000;
                const origH = results.original_height || 1000;
                const leftPercent = Math.max(0, Math.min(100, (box.x / origW) * 100));
                const topPercent = Math.max(0, Math.min(100, (box.y / origH) * 100));
                const widthPercent = Math.max(1, Math.min(100 - leftPercent, (box.width / origW) * 100));
                const heightPercent = Math.max(1, Math.min(100 - topPercent, (box.height / origH) * 100));

                const isFailed = detection.status === "Failed";
                const isPassed = detection.status === "Passed";

                const borderColor = isFailed
                  ? "border-red-500"
                  : isPassed
                  ? "border-emerald-400"
                  : "border-yellow-400";

                const bgColor = isFailed
                  ? "bg-red-500/20 hover:bg-red-500/30"
                  : isPassed
                  ? "bg-emerald-500/20 hover:bg-emerald-500/30"
                  : "bg-yellow-500/20 hover:bg-yellow-500/30";

                const isNearTop = topPercent < 5;
                const isHovered = hoveredDetection === detection;

                return (
                  <motion.div
                    key={`${detection.category || 'det'}-${box.x}-${box.y}-${index}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    onMouseEnter={() => setHoveredDetection(detection)}
                    onMouseLeave={() => setHoveredDetection(null)}
                    className={`absolute border-2 border-dashed rounded-md cursor-pointer transition-all duration-150 ${
                      isHovered ? "z-30 ring-2 ring-blue-400 shadow-lg" : "z-20"
                    } ${borderColor} ${bgColor}`}
                    style={{
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                    }}
                  >
                    {/* Floating badge for box */}
                    <div
                      className={`absolute ${
                        isNearTop ? "top-1 left-1" : "-top-3.5 left-0"
                      } text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded shadow-sm text-white whitespace-nowrap pointer-events-none ${
                        isFailed
                          ? "bg-red-600"
                          : isPassed
                          ? "bg-emerald-600"
                          : "bg-yellow-600"
                      }`}
                    >
                      {detection.category ? `${detection.category}: ${detection.status}` : detection.status}
                    </div>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>

        {/* Hovered Detection Floating Info Card */}
        <AnimatePresence>
          {hoveredDetection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-4 left-4 right-4 z-30 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3.5 text-xs shadow-2xl pointer-events-none"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    hoveredDetection.status === "Failed"
                      ? "bg-red-500"
                      : hoveredDetection.status === "Passed"
                      ? "bg-emerald-400"
                      : "bg-yellow-400"
                  }`}
                />
                <span className="font-bold text-slate-100 uppercase tracking-wide">
                  {hoveredDetection.category || hoveredDetection.status}
                </span>
                <Badge
                  variant={
                    hoveredDetection.status === "Passed"
                      ? "success"
                      : hoveredDetection.status === "Failed"
                      ? "destructive"
                      : "warning"
                  }
                  className="text-[10px]"
                >
                  {hoveredDetection.status}
                </Badge>
              </div>
              <p className="text-slate-300 font-mono break-words leading-relaxed">
                {hoveredDetection.label}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Toolbar */}
      <div className="mt-4 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/70 px-4 py-2 rounded-2xl shadow-xl">
        <button
          onClick={() => setShowBoxes(!showBoxes)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            showBoxes
              ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          title="Toggle Bounding Boxes"
        >
          {showBoxes ? <Eye className="w-4 h-4 text-blue-400" /> : <EyeOff className="w-4 h-4" />}
          <span>{showBoxes ? "Hide Boxes" : "Show Boxes"}</span>
        </button>

        <div className="w-px h-5 bg-slate-700/60 mx-1" />

        <button
          onClick={handleZoomIn}
          disabled={zoom >= 2.5}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono text-slate-400 min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.75}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Reset Zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
