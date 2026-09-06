"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
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
  accentColor: "indigo" | "emerald" | "rose" | "amber" | "violet";
  delay?: number;
}

const accentStyles = {
  indigo: {
    iconBg: "bg-indigo-500/10",
    iconText: "text-indigo-400",
    iconBorder: "border-indigo-500/20",
    glow: "#6366f1",
  },
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
    iconBorder: "border-emerald-500/20",
    glow: "#34d399",
  },
  rose: {
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-400",
    iconBorder: "border-rose-500/20",
    glow: "#fb7185",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-400",
    iconBorder: "border-amber-500/20",
    glow: "#fbbf24",
  },
  violet: {
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-400",
    iconBorder: "border-violet-500/20",
    glow: "#8b5cf6",
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
  accentColor,
  delay = 0,
}: KPICardProps) {
  const isPositive = trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColorClass = isPositive ? "text-emerald-400" : "text-rose-400";
  const trendBgClass = isPositive ? "bg-emerald-400/10" : "bg-rose-400/10";
  const accent = accentStyles[accentColor];

  return (
    <BentoCard delay={delay} glowColor={accent.glow}>
      <div className="flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
          <div
            className={`p-2.5 rounded-xl ${accent.iconBg} ${accent.iconText} border ${accent.iconBorder}`}
          >
            {icon}
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${trendBgClass} ${trendColorClass}`}
          >
            <TrendIcon className="w-3.5 h-3.5" />
            <span>
              {isPositive ? "+" : ""}
              {trend}%
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm text-zinc-400 mb-1.5">{title}</p>
          <div className="text-3xl text-zinc-100 flex items-baseline">
            <AnimatedCounter
              value={value}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
            />
          </div>
        </div>

        <p className="text-xs text-zinc-500 mt-3">{trendLabel}</p>
      </div>
    </BentoCard>
  );
}
