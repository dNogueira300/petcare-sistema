"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
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
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-[9px] px-3 text-sm transition-all duration-150",
            "disabled:cursor-not-allowed disabled:opacity-60",
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
          }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p style={{ fontSize: "0.73rem", color: "#dc2626", fontFamily: "var(--font-dm-sans)" }}>
            {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";
