"use client";

import React from "react";
import { motion } from "framer-motion";

export interface BentoCardProps {
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  delay?: number;
  glowColor?: string;
}

export function BentoCard({
  title,
  icon,
  className = "",
  children,
  delay = 0,
  glowColor,
}: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: "spring", bounce: 0.3 }}
      whileHover={{ scale: 1.01 }}
      className={`relative overflow-hidden rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-white/[0.08] shadow-xl shadow-black/20 hover:border-white/[0.15] transition-colors duration-300 ${className}`}
    >
      {/* Subtle gradient overlay at top */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      {glowColor && (
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-20"
          style={{ backgroundColor: glowColor }}
        />
      )}

      <div className="p-6 relative z-10 flex flex-col h-full">
        {(title || icon) && (
          <div className="flex items-center gap-3 mb-4">
            {icon && <div className="text-zinc-400">{icon}</div>}
            {title && (
              <h3 className="text-zinc-100 font-medium tracking-tight">
                {title}
              </h3>
            )}
          </div>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </motion.div>
  );
}
