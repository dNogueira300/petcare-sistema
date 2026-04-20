import { cn } from "@/lib/utils";
import type { EstadoCita } from "@/types";

type BadgeVariant = EstadoCita | "info" | "default";

const variantClasses: Record<BadgeVariant, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmada: "bg-petcare-100 text-petcare-800 border-petcare-200",
  cancelada: "bg-red-100 text-red-800 border-red-200",
  atendida: "bg-blue-100 text-blue-800 border-blue-200",
  info: "bg-gray-100 text-gray-700 border-gray-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
};

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
