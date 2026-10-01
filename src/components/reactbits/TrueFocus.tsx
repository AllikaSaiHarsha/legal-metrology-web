'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const TrueFocus: React.FC<TrueFocusProps> = ({
  sentence = 'Legal Metrology Vision Scanner',
  separator = ' ',
  manualMode = false,
  blurAmount = 4,
  borderColor = '#6366f1',
  glowColor = 'rgba(99, 102, 241, 0.4)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1.2,
  className = ''
}) => {
  const words = useMemo(() => sentence.split(separator), [sentence, separator]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState<FocusRect>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!manualMode) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % words.length);
      }, (animationDuration + pauseBetweenAnimations) * 1000);

      return () => clearInterval(interval);
    }
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left - 4,
      y: activeRect.top - parentRect.top - 2,
      width: activeRect.width + 8,
      height: activeRect.height + 4
    });
  }, [currentIndex, words.length]);

  const handleMouseEnter = (index: number) => {
    if (manualMode) {
      setLastActiveIndex(index);
      setCurrentIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (manualMode) {
      setCurrentIndex(lastActiveIndex ?? 0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex flex-wrap items-center gap-2 cursor-pointer select-none ${className}`}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={el => {
              wordRefs.current[index] = el;
            }}
            className="relative font-bold transition-all duration-300 tracking-tight"
            style={{
              filter: manualMode
                ? isActive
                  ? 'blur(0px)'
                  : `blur(${blurAmount}px)`
                : isActive
                ? 'blur(0px)'
                : `blur(${blurAmount}px)`,
              opacity: isActive ? 1 : 0.4
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {word}
          </span>
        );
      })}

      <motion.div
        className="pointer-events-none absolute rounded-lg border-2 z-10"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: focusRect.width > 0 ? 1 : 0
        }}
        transition={{
          duration: animationDuration,
          ease: 'easeInOut'
        }}
        style={{
          borderColor,
          boxShadow: `0 0 16px ${glowColor}, inset 0 0 8px ${glowColor}`
        }}
      >
        <span
          className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2"
          style={{ borderColor }}
        />
        <span
          className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2"
          style={{ borderColor }}
        />
        <span
          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2"
          style={{ borderColor }}
        />
        <span
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2"
          style={{ borderColor }}
        />
      </motion.div>
    </div>
  );
};

export default TrueFocus;
