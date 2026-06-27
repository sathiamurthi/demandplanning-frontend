"use client";

/**
 * UI Primitives — drop-in components for every CRUD page
 *
 *   Modal         — overlay dialog wrapper
 *   useToast      — toast notification hook + <Toaster> component
 *   Badge         — status pill
 *   ConfirmDialog — delete/destructive confirm
 *   EmptyState    — zero-results placeholder
 *   Spinner       — loading indicator
 *   SearchInput   — debounced search box
 *   PageHeader    — title + subtitle + action slot
 *   ViewToggle    — grid / table switcher
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  LayoutGrid,
  List,
  Loader2,
  Search,
  X,
  XCircle,
} from "lucide-react";

/* ═══════════════════════════════════════
   Modal
════════════════════════════════════════ */

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Extra classes for the inner panel */
  panelClassName?: string;
  /** Hide the default close button */
  hideCloseButton?: boolean;
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  panelClassName = "",
  hideCloseButton = false,
}: ModalProps) {
  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        className={`relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 ${panelClassName}`}
        style={{ animation: "modalIn 0.18s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        {children}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}

/** Convenience sub-components */
Modal.Body = function ModalBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
};

Modal.Footer = function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
      {children}
    </div>
  );
};

/* ═══════════════════════════════════════
   Button
════════════════════════════════════════ */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gray-900 text-white hover:bg-gray-700 focus:ring-gray-900/20 border-transparent",
  secondary:
    "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 focus:ring-gray-400/20",
  danger:
    "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 focus:ring-red-400/20",
  ghost:
    "bg-transparent text-gray-600 border-transparent hover:bg-gray-100 focus:ring-gray-400/20",
};

export function Button({
  variant = "secondary",
  loading,
  icon,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:cursor-not-allowed disabled:opacity-50
        ${variantClasses[variant]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="h-4 w-4">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════
   Toast
════════════════════════════════════════ */

type ToastType = "success" | "error" | "info" | "warning";

type Toast = { id: string; message: string; type: ToastType };

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastCtx = createContext<ToastContextValue>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "success") => {
    const id = String(Date.now());
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    error:   <XCircle      className="h-4 w-4 text-red-500"     />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500"  />,
    info:    <Info          className="h-4 w-4 text-blue-500"    />,
  };

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg pointer-events-auto"
            style={{ animation: "toastIn 0.2s ease" }}
          >
            {icons[t.type]}
            <span className="text-sm text-gray-800">{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateY(8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)   scale(1);    }
        }
      `}</style>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

/* ═══════════════════════════════════════
   Badge
════════════════════════════════════════ */

type BadgeVariant = "success" | "error" | "warning" | "info" | "neutral";

const badgeClasses: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  error:   "bg-red-50    text-red-600     border-red-200",
  warning: "bg-amber-50  text-amber-700   border-amber-200",
  info:    "bg-blue-50   text-blue-700    border-blue-200",
  neutral: "bg-gray-100  text-gray-600    border-gray-200",
};

export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClasses[variant]}`}
    >
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════
   ConfirmDialog
════════════════════════════════════════ */

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} panelClassName="max-w-sm">
      <Modal.Body>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <p className="pt-1.5 text-sm text-gray-600">{message}</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/* ═══════════════════════════════════════
   EmptyState
════════════════════════════════════════ */

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
        📭
      </div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════
   Spinner
════════════════════════════════════════ */

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <Loader2 className={`animate-spin text-gray-400 ${className}`} />
  );
}

export function FullPageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

/* ═══════════════════════════════════════
   SearchInput
════════════════════════════════════════ */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   PageHeader
════════════════════════════════════════ */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-white px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════
   ViewToggle
════════════════════════════════════════ */

export function ViewToggle({
  view,
  onChange,
}: {
  view: "grid" | "table";
  onChange: (v: "grid" | "table") => void;
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      {(["grid", "table"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            view === v
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          {v === "grid" ? (
            <LayoutGrid className="h-3.5 w-3.5" />
          ) : (
            <List className="h-3.5 w-3.5" />
          )}
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  );
}