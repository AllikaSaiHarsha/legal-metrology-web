'use client';

import React from 'react';

export type StarBorderProps<T extends React.ElementType = 'button'> = {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: string;
  thickness?: number;
  backgroundColor?: string;
  borderColor?: string;
} & React.ComponentPropsWithoutRef<T>;

export const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  color = '#6366f1',
  speed = '4s',
  thickness = 1.5,
  backgroundColor = 'rgba(24, 24, 27, 0.95)',
  borderColor = 'rgba(255, 255, 255, 0.1)',
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-2xl group ${className}`}
      {...(rest as any)}
      style={{
        padding: `${thickness}px`,
        ...(rest as any).style
      }}
    >
      <style jsx global>{`
        @keyframes star-movement-bottom {
          0% {
            transform: translate(0%, 0%);
            opacity: 1;
          }
          100% {
            transform: translate(-100%, 0%);
            opacity: 0.2;
          }
        }
        @keyframes star-movement-top {
          0% {
            transform: translate(0%, 0%);
            opacity: 1;
          }
          100% {
            transform: translate(100%, 0%);
            opacity: 0.2;
          }
        }
      `}</style>
      <div
        className="absolute w-[300%] h-[60%] opacity-80 bottom-[-15px] right-[-250%] rounded-full pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 20%)`,
          animation: `star-movement-bottom ${speed} linear infinite alternate`
        }}
      />
      <div
        className="absolute w-[300%] h-[60%] opacity-80 top-[-15px] left-[-250%] rounded-full pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 20%)`,
          animation: `star-movement-top ${speed} linear infinite alternate`
        }}
      />
      <div
        className="relative z-10 w-full h-full rounded-[inherit] transition-colors"
        style={{ background: backgroundColor, border: `1px solid ${borderColor}` }}
      >
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
