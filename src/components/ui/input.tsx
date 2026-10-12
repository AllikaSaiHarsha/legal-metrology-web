import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner backdrop-blur-md transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:border-blue-500/80 focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
