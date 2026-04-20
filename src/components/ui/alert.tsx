import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "success" | "error" | "info" | "warning";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const config: Record<AlertVariant, { icon: React.ElementType; classes: string }> = {
  success: {
    icon: CheckCircle,
    classes: "bg-petcare-50 border-petcare-200 text-petcare-800",
  },
  error: {
    icon: AlertCircle,
    classes: "bg-red-50 border-red-200 text-red-800",
  },
  info: {
    icon: Info,
    classes: "bg-blue-50 border-blue-200 text-blue-800",
  },
  warning: {
    icon: AlertTriangle,
    classes: "bg-yellow-50 border-yellow-200 text-yellow-800",
  },
};

export function Alert({ variant = "info", title, message, onClose, className }: AlertProps) {
  const { icon: Icon, classes } = config[variant];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        classes,
        className
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        <p>{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="rounded p-0.5 hover:opacity-70">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
