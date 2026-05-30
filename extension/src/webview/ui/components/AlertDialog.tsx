import React, { useEffect } from "react";

export interface AlertDialogProps {
  open: boolean;
  title: string;
  message: string;
  /** Optional monospace / secondary line (e.g. HTTP detail). */
  detail?: string;
  confirmLabel?: string;
  onClose: () => void;
}

export function AlertDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = "OK",
  onClose,
}: AlertDialogProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="t3d-shell-overlay fixed inset-0 z-60 flex items-center justify-center bg-black/65 px-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rounded-xl border border-white/15 bg-white/8 backdrop-blur-2xl shadow-2xl shadow-black/35 ring-1 ring-white/8 max-w-lg w-full p-6">
        <h2
          id="alert-dialog-title"
          className="text-lg font-semibold text-gray-100 mb-2"
        >
          {title}
        </h2>
        <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed mb-3">
          {message.split("\n").map((line, i) => {
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            return (
              <p key={i} className={line === "" ? "h-2" : "mb-1"}>
                {parts.map((part, j) => {
                  const m = part.match(/^\*\*([^*]+)\*\*$/);
                  if (m) {
                    return (
                      <strong key={j} className="font-semibold text-gray-100">
                        {m[1]}
                      </strong>
                    );
                  }
                  return <span key={j}>{part}</span>;
                })}
              </p>
            );
          })}
        </div>
        {detail ? (
          <pre className="mb-4 max-h-28 overflow-auto rounded border border-white/10 bg-black/35 px-2 py-1.5 text-[11px] text-gray-400 whitespace-pre-wrap wrap-break-word font-mono">
            {detail}
          </pre>
        ) : null}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-400/35 bg-slate-700/30 backdrop-blur-md px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/20 hover:bg-slate-600/35"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
