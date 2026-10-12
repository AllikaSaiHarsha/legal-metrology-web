"use client";

import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface BentoCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  delay?: number;
  glowColor?: string;
}

export function BentoCard({
  title,
  subtitle,
  icon,
  action,
  className = "",
  children,
  delay = 0,
  glowColor = "rgba(37, 99, 235, 0.22)",
}: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, type: "spring", bounce: 0.2 }}
      className={cn(
        "relative overflow-hidden rounded-2xl liquid-glass-card group",
        className
      )}
    >
      {/* Dynamic Cursor Spotlight (KokonutUI style) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out z-0"
        style={{
          opacity,
          background: `radial-gradient(circle 280px at ${position.x}px ${position.y}px, ${glowColor}, transparent 75%)`,
        }}
      />

      {/* Specular Top-Edge Reflection Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-200/20 to-transparent pointer-events-none z-10" />

      <div className="p-6 relative z-10 flex flex-col h-full">
        {(title || icon || action) && (
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-blue-400 shadow-sm shadow-blue-950/40">
                  {icon}
                </div>
              )}
              {title && (
                <div>
                  <h3 className="text-slate-100 font-semibold text-sm tracking-tight">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                  )}
                </div>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </motion.div>
  );
}

export default BentoCard;
