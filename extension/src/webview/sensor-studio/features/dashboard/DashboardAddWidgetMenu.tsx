import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import {
  DASHBOARD_WIDGET_PALETTE,
  type DashboardWidgetCatalogId,
} from "./dashboard-widget-palette";

export function DashboardAddWidgetMenu({
  anchorRect,
  onPick,
  onDismiss,
}: {
  anchorRect: DOMRect;
  onPick: (catalogNodeId: DashboardWidgetCatalogId) => void;
  onDismiss: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const panel = panelRef.current;
      if (panel != null && !panel.contains(event.target as Node)) {
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer, true);
    };
  }, [onDismiss]);

  if (typeof document === "undefined") {
    return null;
  }

  const top = anchorRect.bottom + 6;
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - 220));

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[210] flex min-w-[12rem] max-h-[min(24rem,calc(100vh-16px))] flex-col gap-1 overflow-y-auto rounded-md border border-zinc-700/80 bg-zinc-950/95 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-sm scrollbar-hide"
      style={{ top, left }}
      role="menu"
      aria-label="Add dashboard widget"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <p className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        Place widget
      </p>
      {DASHBOARD_WIDGET_PALETTE.map((entry) => (
        <TRNButton
          key={entry.catalogNodeId}
          size="compact"
          className="h-8 w-full justify-start px-2 text-[11px]"
          hint={entry.description}
          onClick={(event) => {
            event.stopPropagation();
            onPick(entry.catalogNodeId);
          }}
        >
          {entry.label}
        </TRNButton>
      ))}
    </div>,
    document.body,
  );
}
