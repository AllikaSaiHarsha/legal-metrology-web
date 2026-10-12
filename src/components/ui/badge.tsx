import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border border-blue-500/30 bg-blue-500/15 text-blue-300 shadow-sm shadow-blue-900/30",
        secondary:
          "border border-slate-700/60 bg-slate-800/60 text-slate-300",
        destructive:
          "border border-red-500/30 bg-red-500/15 text-red-300 shadow-sm shadow-red-950/40",
        success:
          "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-950/40",
        warning:
          "border border-yellow-500/30 bg-yellow-500/15 text-yellow-300 shadow-sm shadow-yellow-950/40",
        info:
          "border border-cyan-500/30 bg-cyan-500/15 text-cyan-300 shadow-sm shadow-cyan-950/40",
        outline:
          "border border-slate-700/70 text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
