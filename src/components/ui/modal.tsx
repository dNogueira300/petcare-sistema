"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-xl",
          "flex flex-col max-h-[90vh]",
          className,
        )}
      >
        {/* Header — siempre visible */}
        {title && (
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0 rounded-t-2xl">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        {/* Contenido scrolleable — sin padding-bottom: lo provee el footer sticky */}
        <div className="px-6 pt-4 pb-0 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
