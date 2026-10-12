import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 hover:shadow-blue-500/35 border border-blue-400/20",
        destructive:
          "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 hover:text-red-300 shadow-sm",
        outline:
          "border border-slate-700/60 bg-slate-900/40 hover:bg-slate-800/60 text-slate-200 hover:text-white backdrop-blur-md",
        secondary:
          "bg-slate-800/70 text-slate-200 hover:bg-slate-700/70 hover:text-white border border-slate-700/40",
        ghost:
          "text-slate-300 hover:text-white hover:bg-slate-800/50",
        link:
          "text-blue-400 underline-offset-4 hover:underline",
        glass:
          "bg-gradient-to-r from-blue-600/20 to-slate-800/40 text-blue-200 hover:text-white border border-blue-500/30 hover:border-blue-400/50 backdrop-blur-xl shadow-lg shadow-blue-950/40 hover:shadow-blue-600/20",
        compliance:
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25",
        warning:
          "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/25",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-6 text-base font-semibold",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
