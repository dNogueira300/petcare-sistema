"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "#6b5c44",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-[9px] px-3 text-sm transition-all duration-150",
            "placeholder:text-cream-600 disabled:cursor-not-allowed disabled:opacity-60",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "focus:border-gold-500 focus:ring-2 focus:ring-gold-100",
            className,
          )}
          style={{
            background: "var(--input-bg)",
            border: `1.5px solid ${error ? "#f87171" : "var(--input-border)"}`,
            color: "#1a1208",
            fontFamily: "var(--font-dm-sans)",
            outline: "none",
            ...style,
          }}
          {...props}
        />
        {error && (
          <p style={{ fontSize: "0.73rem", color: "#dc2626", fontFamily: "var(--font-dm-sans)" }}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p style={{ fontSize: "0.73rem", color: "#a89a80", fontFamily: "var(--font-dm-sans)" }}>
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
