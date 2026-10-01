"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { DecryptedText } from "@/components/reactbits";

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
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      border: "border-l-emerald-500",
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
    },
    fail: {
      icon: <XCircle className="w-5 h-5 text-rose-500" />,
      border: "border-l-rose-500",
      bg: "bg-rose-500/10",
      text: "text-rose-500",
    },
    warning: {
      icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
      border: "border-l-amber-500",
      bg: "bg-amber-500/10",
      text: "text-amber-500",
    },
  };

  const severityConfig = {
    critical: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    major: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    minor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };

  const activeStatus = statusConfig[status];

  const cardRef = React.useRef<HTMLDivElement>(null);
  const [spotlightPos, setSpotlightPos] = React.useState({ x: 0, y: 0 });
  const [spotlightOpacity, setSpotlightOpacity] = React.useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const glowColorMap = {
    pass: "rgba(52, 211, 153, 0.12)",
    fail: "rgba(244, 63, 94, 0.15)",
    warning: "rgba(251, 191, 36, 0.12)",
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setSpotlightOpacity(0.9)}
      onMouseLeave={() => setSpotlightOpacity(0)}
      layout
      className={`relative rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-white/[0.08] overflow-hidden shadow-lg border-l-4 ${activeStatus.border} hover:border-white/[0.15] transition-all`}
    >
      {/* React Bits spotlight effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out z-0"
        style={{
          opacity: spotlightOpacity,
          background: `radial-gradient(circle 220px at ${spotlightPos.x}px ${spotlightPos.y}px, ${glowColorMap[status]}, transparent 80%)`,
        }}
      />

      <div
        className="relative z-10 p-4 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full ${activeStatus.bg}`}>
            {activeStatus.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-zinc-400">
                <DecryptedText
                  text={ruleCode}
                  speed={25}
                  maxIterations={6}
                  animateOn="hover"
                  className="text-zinc-300 font-mono text-xs font-semibold"
                  encryptedClassName="text-indigo-400 font-mono text-xs"
                />
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${severityConfig[severity]}`}
              >
                {severity}
              </span>
            </div>
            <h4 className="text-zinc-100 font-medium">{title}</h4>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-zinc-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-white/[0.04]">
              <p className="text-zinc-400 text-sm mt-4 mb-4">{description}</p>

              {(extractedValue || expectedValue) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {extractedValue && (
                    <div className="bg-black/20 rounded-xl p-3 border border-white/[0.05]">
                      <p className="text-xs text-zinc-500 mb-1">Extracted Value</p>
                      <p className="text-sm text-zinc-200 font-mono">
                        {extractedValue}
                      </p>
                    </div>
                  )}
                  {expectedValue && (
                    <div className="bg-black/20 rounded-xl p-3 border border-white/[0.05]">
                      <p className="text-xs text-zinc-500 mb-1">Expected Value</p>
                      <p className="text-sm text-zinc-200 font-mono">
                        {expectedValue}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {remediation &&
                status === "fail" &&
                !remediation.includes("Ensure declaration is clearly printed") && (
                <div className="bg-rose-500/5 rounded-xl p-3 border border-rose-500/10 mt-2">
                  <p className="text-xs font-semibold text-rose-400 mb-1">
                    Remediation Required
                  </p>
                  <p className="text-sm text-zinc-300">{remediation}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
