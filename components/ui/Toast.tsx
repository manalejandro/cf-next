"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((msg: string) => toast("success", msg), [toast]);
  const error = useCallback((msg: string) => toast("error", msg), [toast]);
  const warning = useCallback((msg: string) => toast("warning", msg), [toast]);
  const info = useCallback((msg: string) => toast("info", msg), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />,
    error: <XCircle className="h-4 w-4 text-[var(--color-error)]" />,
    warning: <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />,
    info: <Info className="h-4 w-4 text-[var(--color-info)]" />,
  };

  const borders: Record<ToastType, string> = {
    success: "border-[var(--color-success)]",
    error: "border-[var(--color-error)]",
    warning: "border-[var(--color-warning)]",
    info: "border-[var(--color-info)]",
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border bg-[var(--bg-elevated)] px-4 py-3 shadow-lg ${borders[toast.type]}`}
      style={{ borderLeftWidth: "3px" }}
    >
      <span className="mt-0.5 shrink-0">{icons[toast.type]}</span>
      <p className="flex-1 text-sm text-[var(--text-primary)]">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
