import React from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="openui-toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`openui-toast ${toast.type || "success"}`}>
          {toast.type === "error" ? (
            <AlertCircle size={14} style={{ color: "var(--openui-danger)" }} />
          ) : toast.type === "info" ? (
            <Info size={14} style={{ color: "var(--openui-brand)" }} />
          ) : (
            <CheckCircle2 size={14} style={{ color: "var(--openui-success)" }} />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
