import { Maximize2, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { CourseDiagramJsonEditor } from "./CourseDiagramJsonEditor";

export function CourseDiagramPopOutEditor({
  diagramId,
  open,
  onClose,
}: {
  diagramId: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Diagram editor · ${diagramId}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex h-[min(92vh,920px)] w-[min(96vw,1200px)] flex-col overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Maximize2 size={15} strokeWidth={2} style={{ color: "var(--accent-amber)" }} />
            <span className="truncate">Diagram editor · {diagramId}</span>
          </div>
          <TRNButton size="compact" hint="Close pop-out editor (Esc)" onClick={onClose}>
            <X size={14} strokeWidth={2} />
          </TRNButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide px-4 py-3">
          <CourseDiagramJsonEditor diagramId={diagramId} embedded />
        </div>
      </div>
    </div>,
    document.body,
  );
}
