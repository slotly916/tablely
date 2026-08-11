"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastKind = "error" | "success";
export type ToastState = { kind: ToastKind; message: string; id: number } | null;

const COLORS: Record<ToastKind, { bg: string; border: string; text: string; icon: string }> = {
  error:   { bg: "#FEE8E8", border: "rgba(226,75,74,0.25)",  text: "#B3312F", icon: "#E24B4A" },
  success: { bg: "#E8F8F1", border: "rgba(37,194,129,0.25)", text: "#12805A", icon: "#25C281" },
};

/**
 * Zentrales Nutzer-Feedback fuer fehlgeschlagene Supabase-Aufrufe.
 * showError() wird ueberall dort aufgerufen wo ein { error } zurueckkommt,
 * damit kein Fehler mehr still geschluckt wird.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const counter = useRef(0);

  const showError = useCallback((message: string) => {
    counter.current += 1;
    setToast({ kind: "error", message, id: counter.current });
  }, []);

  const showSuccess = useCallback((message: string) => {
    counter.current += 1;
    setToast({ kind: "success", message, id: counter.current });
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  return { toast, showError, showSuccess, closeToast };
}

/**
 * Nimmt einen Supabase-Fehler und baut daraus eine lesbare deutsche Meldung.
 * Die technische Meldung wird angehaengt, damit Support-Faelle nachvollziehbar sind.
 */
export function errorText(prefix: string, error: { message?: string } | null | undefined) {
  const detail = error?.message ? ` (${error.message})` : "";
  return `${prefix}${detail}`;
}

export default function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  // onClose in einem Ref halten, damit ein inline uebergebener Callback den
  // Auto-Close-Timer nicht bei jedem Re-Render der Seite neu startet.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!toast) return;
    const ms = toast.kind === "error" ? 8000 : 3000;
    const timer = setTimeout(() => closeRef.current(), ms);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const c = COLORS[toast.kind];

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      aria-live={toast.kind === "error" ? "assertive" : "polite"}
      style={{
        position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
        zIndex: 9999, maxWidth: "min(520px, calc(100vw - 32px))", width: "max-content",
        display: "flex", alignItems: "flex-start", gap: "10px",
        background: c.bg, border: `1px solid ${c.border}`, borderRadius: "12px",
        padding: "12px 14px", boxShadow: "0 12px 32px rgba(26,26,46,0.18)",
        fontFamily: "var(--font-sans)", fontSize: "13px", lineHeight: 1.5, color: c.text,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: "1px" }}>
        {toast.kind === "error" ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke={c.icon} strokeWidth="1.5" />
            <path d="M8 4.5v4M8 11v.5" stroke={c.icon} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5l3 3 6.5-7" stroke={c.icon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span style={{ flex: 1, minWidth: 0, wordBreak: "break-word" }}>{toast.message}</span>
      <button
        onClick={onClose}
        aria-label="Meldung schliessen"
        style={{
          flexShrink: 0, background: "transparent", border: "none", cursor: "pointer",
          color: c.text, opacity: 0.5, fontSize: "16px", lineHeight: 1, padding: "0 2px",
          fontFamily: "inherit",
        }}
      >
        ×
      </button>
    </div>
  );
}
