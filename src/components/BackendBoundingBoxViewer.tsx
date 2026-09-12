"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { AnalysisResult, Detection } from "@/lib/api";

interface Props {
  imageUrl: string;
  results: AnalysisResult | null;
}

export default function BackendBoundingBoxViewer({ imageUrl, results }: Props) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [hoveredDetection, setHoveredDetection] = useState<Detection | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 select-none">
      {/* Viewer Box */}
      <div className="relative w-full max-w-xl max-h-[620px] rounded-3xl overflow-hidden bg-zinc-900 border border-white/[0.08] shadow-2xl shadow-black/40 flex items-center justify-center">
        {/* Subtle background mesh grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#27272a 1px, transparent 1px), linear-gradient(90deg, #27272a 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div
          className="relative transition-transform duration-200 ease-out inline-block w-fit h-fit max-h-[560px]"
          style={{ transform: `scale(${zoom})` }}
        >
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
                  ? "border-rose-500"
                  : isPassed
                  ? "border-emerald-400"
                  : "border-amber-400";

                const bgColor = isFailed
                  ? "bg-rose-500/20 hover:bg-rose-500/30"
                  : isPassed
                  ? "bg-emerald-500/20 hover:bg-emerald-500/30"
                  : "bg-amber-500/20 hover:bg-amber-500/30";

                const isNearTop = topPercent < 5;
                const isHovered = hoveredDetection === detection;

                return (
                  <motion.div
                    key={`${detection.category || 'det'}-${box.x}-${box.y}-${index}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.02 }}
                    onMouseEnter={() => setHoveredDetection(detection)}
                    onMouseLeave={() => setHoveredDetection(null)}
                    className={`absolute border-2 border-dashed rounded-md cursor-pointer transition-all duration-150 ${
                      isHovered ? "z-30 ring-2 ring-white/60 shadow-lg" : "z-20"
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
                          ? "bg-rose-600"
                          : isPassed
                          ? "bg-emerald-600"
                          : "bg-amber-600"
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
              className="absolute top-4 left-4 right-4 z-30 bg-zinc-950/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 text-xs shadow-2xl pointer-events-none"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    hoveredDetection.status === "Failed"
                      ? "bg-rose-500"
                      : hoveredDetection.status === "Passed"
                      ? "bg-emerald-400"
                      : "bg-amber-400"
                  }`}
                />
                <span className="font-bold text-zinc-100 uppercase tracking-wide">
                  {hoveredDetection.category || hoveredDetection.status}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    hoveredDetection.status === "Failed"
                      ? "bg-rose-500/20 text-rose-300"
                      : hoveredDetection.status === "Passed"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {hoveredDetection.status}
                </span>
              </div>
              <p className="text-zinc-300 font-mono break-words leading-relaxed">
                {hoveredDetection.label}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Toolbar */}
      <div className="mt-4 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] px-4 py-2 rounded-2xl shadow-xl">
        <button
          onClick={() => setShowBoxes(!showBoxes)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            showBoxes
              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
          }`}
          title="Toggle Bounding Boxes"
        >
          {showBoxes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>{showBoxes ? "Hide Boxes" : "Show Boxes"}</span>
        </button>

        <div className="w-px h-5 bg-white/[0.08] mx-1" />

        <button
          onClick={handleZoomIn}
          disabled={zoom >= 2.5}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono text-zinc-400 min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.75}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
          title="Reset Zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
