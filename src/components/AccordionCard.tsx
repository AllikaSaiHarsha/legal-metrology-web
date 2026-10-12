"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface AccordionCardProps {
  ruleCode: string;
  title: string;
  severity: "critical" | "major" | "minor";
  status: "pass" | "fail" | "warning";
  description: string;
  extractedValue?: string;
  expectedValue?: string;
  remediation?: string;
  defaultOpen?: boolean;
}

export function AccordionCard({
  ruleCode,
  title,
  severity,
  status,
  description,
  extractedValue,
  expectedValue,
  remediation,
  defaultOpen = false,
}: AccordionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const statusConfig = {
    pass: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      border: "border-l-emerald-500",
      bg: "bg-emerald-500/15",
      badgeVariant: "success" as const,
    },
    fail: {
      icon: <XCircle className="w-4 h-4 text-red-400" />,
      border: "border-l-red-500",
      bg: "bg-red-500/15",
      badgeVariant: "destructive" as const,
    },
    warning: {
      icon: <AlertCircle className="w-4 h-4 text-yellow-400" />,
      border: "border-l-yellow-500",
      bg: "bg-yellow-500/15",
      badgeVariant: "warning" as const,
    },
  };

  const activeStatus = statusConfig[status];

  const cardRef = useRef<HTMLDivElement>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  const [spotlightOpacity, setSpotlightOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const glowColorMap = {
    pass: "rgba(34, 197, 94, 0.12)",
    fail: "rgba(239, 68, 68, 0.15)",
    warning: "rgba(234, 179, 8, 0.12)",
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setSpotlightOpacity(1)}
      onMouseLeave={() => setSpotlightOpacity(0)}
      layout
      className={`relative rounded-xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 overflow-hidden shadow-lg border-l-4 ${activeStatus.border} hover:border-slate-700/80 transition-all`}
    >
      {/* Specular Spotlight effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out z-0"
        style={{
          opacity: spotlightOpacity,
          background: `radial-gradient(circle 220px at ${spotlightPos.x}px ${spotlightPos.y}px, ${glowColorMap[status]}, transparent 80%)`,
        }}
      />

      <div
        className="relative z-10 p-4 cursor-pointer flex items-center justify-between hover:bg-slate-800/20 transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3.5">
          <div className={`p-2 rounded-lg ${activeStatus.bg}`}>
            {activeStatus.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold text-blue-400">
                {ruleCode}
              </span>
              <Badge variant={activeStatus.badgeVariant} className="text-[10px] py-0 px-2 uppercase">
                {severity}
              </Badge>
            </div>
            <h4 className="text-slate-100 font-semibold text-xs tracking-tight">{title}</h4>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-slate-400 p-1 rounded-lg hover:bg-slate-800"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-slate-800/60">
              <p className="text-slate-400 text-xs mt-3 mb-3 leading-relaxed">{description}</p>

              {(extractedValue || expectedValue) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {extractedValue && (
                    <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
                        Extracted Declaration
                      </p>
                      <p className="text-xs text-slate-200 font-mono">
                        {extractedValue}
                      </p>
                    </div>
                  )}
                  {expectedValue && (
                    <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
                        Mandatory Statutory Standard
                      </p>
                      <p className="text-xs text-slate-200 font-mono">
                        {expectedValue}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {remediation &&
                status === "fail" &&
                !remediation.includes("Ensure declaration is clearly printed") && (
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20 mt-2">
                  <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">
                    Remediation Required Under PCR 2011
                  </p>
                  <p className="text-xs text-slate-300">{remediation}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AccordionCard;
