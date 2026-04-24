"use client";

import { createContext, useContext, useCallback, useState, useRef } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertCircle,
  info:    Info,
};

const styles: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
  success: { bg: "#f0fdf4", border: "#86efac", icon: "#16a34a", bar: "#22c55e" },
  error:   { bg: "#fff1f2", border: "#fda4af", icon: "#dc2626", bar: "#f43f5e" },
  warning: { bg: "#fffbeb", border: "#fcd34d", icon: "#d97706", bar: "#f59e0b" },
  info:    { bg: "#eff6ff", border: "#93c5fd", icon: "#2563eb", bar: "#3b82f6" },
};

let nextId = 1;

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const Icon = icons[toast.type];
  const s = styles[toast.type];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: "10px",
        padding: "12px 14px",
        boxShadow: "0 4px 16px rgba(26,18,8,0.12), 0 1px 4px rgba(26,18,8,0.08)",
        minWidth: "280px",
        maxWidth: "360px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-dm-sans)",
        animation: "toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      <Icon style={{ width: "16px", height: "16px", color: s.icon, flexShrink: 0, marginTop: "1px" }} />
      <p style={{ margin: 0, fontSize: "0.83rem", color: "#1a1208", fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0",
          color: "#a89a80",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#1a1208")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#a89a80")}
      >
        <X style={{ width: "13px", height: "13px" }} />
      </button>
      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          background: s.bar,
          borderRadius: "0 0 0 10px",
          animation: `toastProgress ${toast.duration}ms linear both`,
          opacity: 0.7,
        }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
    const timer = setTimeout(() => remove(id), duration);
    timers.current.set(id, timer);
  }, [remove]);

  const ctx: ToastContextValue = {
    success: (msg) => push("success", msg),
    error:   (msg) => push("error", msg),
    warning: (msg) => push("warning", msg),
    info:    (msg) => push("info", msg),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
