'use client';

import { motion, type Transition } from 'framer-motion';
import { useEffect, useRef, useState, useMemo } from 'react';

export type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  onAnimationComplete?: () => void;
  stepDuration?: number;
};

export const BlurText: React.FC<BlurTextProps> = ({
  text = '',
  delay = 50,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  onAnimationComplete,
  stepDuration = 0.35
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current as Element);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo(
    () =>
      direction === 'top'
        ? { filter: 'blur(10px)', opacity: 0, y: -20 }
        : { filter: 'blur(10px)', opacity: 0, y: 20 },
    [direction]
  );

  const defaultTo = useMemo(
    () => [
      { filter: 'blur(4px)', opacity: 0.6, y: direction === 'top' ? 4 : -4 },
      { filter: 'blur(0px)', opacity: 1, y: 0 }
    ],
    [direction]
  );

  const stepCount = defaultTo.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)));

  const keyframes = {
    filter: [defaultFrom.filter, ...defaultTo.map(s => s.filter)],
    opacity: [defaultFrom.opacity, ...defaultTo.map(s => s.opacity)],
    y: [defaultFrom.y, ...defaultTo.map(s => s.y)]
  };

  return (
    <p ref={ref} className={`blur-text ${className} inline-flex flex-wrap`}>
      {elements.map((segment, index) => {
        const spanTransition: Transition = {
          duration: totalDuration,
          times,
          delay: (index * delay) / 1000,
          ease: 'easeOut'
        };

        return (
          <motion.span
            key={index}
            initial={defaultFrom}
            animate={inView ? keyframes : defaultFrom}
            transition={spanTransition}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
            style={{
              display: 'inline-block',
              willChange: 'transform, filter, opacity'
            }}
          >
            {segment === ' ' ? '\u00A0' : segment}
            {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
          </motion.span>
        );
      })}
    </p>
  );
};

export default BlurText;
