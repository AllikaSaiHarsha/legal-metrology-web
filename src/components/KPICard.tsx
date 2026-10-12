"use client";

import React, { useEffect, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { animate } from "animejs";
import { BentoCard } from "./BentoCard";
import { AnimatedCounter } from "./AnimatedCounter";

export interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend: number;
  trendLabel: string;
  icon: React.ReactNode;
  accentColor: "cobalt" | "indigo" | "emerald" | "rose" | "amber" | "violet";
  delay?: number;
  progressPercent?: number; // Optional gauge percent (0-100)
}

const accentStyles = {
  cobalt: {
    iconBg: "bg-blue-600/15",
    iconText: "text-blue-400",
    iconBorder: "border-blue-500/25",
    glow: "rgba(37, 99, 235, 0.25)",
    stroke: "#2563eb",
  },
  indigo: {
    iconBg: "bg-blue-600/15",
    iconText: "text-blue-400",
    iconBorder: "border-blue-500/25",
    glow: "rgba(37, 99, 235, 0.25)",
    stroke: "#3b82f6",
  },
  emerald: {
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-400",
    iconBorder: "border-emerald-500/25",
    glow: "rgba(34, 197, 94, 0.25)",
    stroke: "#22c55e",
  },
  rose: {
    iconBg: "bg-red-500/15",
    iconText: "text-red-400",
    iconBorder: "border-red-500/25",
    glow: "rgba(239, 68, 68, 0.25)",
    stroke: "#ef4444",
  },
  amber: {
    iconBg: "bg-yellow-500/15",
    iconText: "text-yellow-400",
    iconBorder: "border-yellow-500/25",
    glow: "rgba(234, 179, 8, 0.25)",
    stroke: "#eab308",
  },
  violet: {
    iconBg: "bg-purple-500/15",
    iconText: "text-purple-400",
    iconBorder: "border-purple-500/25",
    glow: "rgba(168, 85, 247, 0.25)",
    stroke: "#a855f7",
  },
};

export function KPICard({
  title,
  value,
  prefix,
  suffix,
  decimals,
  trend,
  trendLabel,
  icon,
  accentColor = "cobalt",
  delay = 0,
  progressPercent,
}: KPICardProps) {
  const isPositive = trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColorClass = isPositive ? "text-emerald-400" : "text-rose-400";
  const trendBgClass = isPositive ? "bg-emerald-500/15 border-emerald-500/30" : "bg-red-500/15 border-red-500/30";
  const accent = accentStyles[accentColor] || accentStyles.cobalt;

  const circleRef = useRef<SVGCircleElement>(null);
  const percent = progressPercent ?? Math.min(100, Math.max(10, (value % 100) || 75));
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffsetTarget = circumference - (percent / 100) * circumference;

  useEffect(() => {
    if (!circleRef.current) return;
    try {
      animate(circleRef.current, {
        strokeDashoffset: [circumference, strokeDashoffsetTarget],
        duration: 1400,
        delay: delay * 1000 + 200,
        ease: "outQuad",
      });
    } catch {
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = `${strokeDashoffsetTarget}`;
      }
    }
  }, [circumference, strokeDashoffsetTarget, delay]);

  return (
    <BentoCard delay={delay} glowColor={accent.glow}>
      <div className="flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
          <div
            className={`p-2.5 rounded-xl ${accent.iconBg} ${accent.iconText} border ${accent.iconBorder} shadow-sm`}
          >
            {icon}
          </div>

          <div className="flex items-center gap-2">
            {/* Precision Micro Radial Gauge (Anime.js animated) */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 54 54">
                <circle
                  cx="27"
                  cy="27"
                  r={radius}
                  className="stroke-slate-800/80 fill-none"
                  strokeWidth="4"
                />
                <circle
                  ref={circleRef}
                  cx="27"
                  cy="27"
                  r={radius}
                  stroke={accent.stroke}
                  className="fill-none"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-mono font-medium text-slate-300">
                  {Math.round(percent)}%
                </span>
              </div>
            </div>

            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${trendBgClass} ${trendColorClass}`}
            >
              <TrendIcon className="w-3.5 h-3.5" />
              <span>
                {isPositive ? "+" : ""}
                {trend}%
              </span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
            {title}
          </p>
          <div className="text-3xl font-bold tracking-tight text-slate-100 flex items-baseline">
            <AnimatedCounter
              value={value}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60 text-xs text-slate-400">
          <span>{trendLabel}</span>
          <span className="font-mono text-[11px] text-slate-500">
            MET-STD-2011
          </span>
        </div>
      </div>
    </BentoCard>
  );
}

export default KPICard;
