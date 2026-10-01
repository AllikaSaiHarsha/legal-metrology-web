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
  glowColor = "rgba(99, 102, 241, 0.18)",
}: BentoCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = React.useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(0.85)}
      onMouseLeave={() => setOpacity(0)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: "spring", bounce: 0.3 }}
      whileHover={{ scale: 1.01 }}
      className={`relative overflow-hidden rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-white/[0.08] shadow-xl shadow-black/20 hover:border-white/[0.18] transition-all duration-300 ${className}`}
    >
      {/* React Bits dynamic spotlight effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out z-0"
        style={{
          opacity,
          background: `radial-gradient(circle 260px at ${position.x}px ${position.y}px, ${glowColor}, transparent 80%)`,
        }}
      />

      {/* Subtle gradient overlay at top */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none z-0" />

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
