"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-[9px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.97]";

const variants: Record<Variant, string> = {
  primary:
    "bg-forest-900 text-cream-300 hover:bg-forest-800 active:bg-forest-700 shadow-sm hover:shadow-md focus-visible:ring-forest-400",
  secondary:
    "bg-cream-200 text-cream-900 hover:bg-cream-300 active:bg-cream-400 focus-visible:ring-cream-500",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm focus-visible:ring-red-400",
  ghost:
    "text-cream-700 hover:bg-cream-200 active:bg-cream-300 focus-visible:ring-cream-400",
  outline:
    "border border-cream-400 text-cream-800 hover:bg-cream-100 active:bg-cream-200 focus-visible:ring-cream-400",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      style={{ fontFamily: "var(--font-dm-sans)", letterSpacing: "0.01em" }}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: "13px", height: "13px",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.7s linear infinite",
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
