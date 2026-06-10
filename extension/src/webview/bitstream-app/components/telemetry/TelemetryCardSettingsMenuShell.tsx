/*******************************************************************************
 * File Name : TelemetryCardSettingsMenuShell.tsx
 *
 * Description : Portaled gear menu for telemetry card headers — escapes overflow
 *               clips in the Sensor Telemetry scroll pane.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Settings2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { TRNMenuPanel } from "@/ui/TRN";
import { useFixedMenuAnchor } from "@/ui/hooks/useFixedMenuAnchor";

export const TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS =
  "flex w-full shrink-0 items-start justify-start gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-left text-sm font-normal text-zinc-100 shadow-none transition-colors hover:border-white/20 hover:bg-white/12";

const PANEL_WIDTH_CLASS = "w-[min(19rem,calc(100vw-1rem))]";

export type TelemetryCardSettingsMenuShellProps = {
  ariaLabel: string;
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
};

/**
 * Settings2 trigger + {@link TRNMenuPanel} portaled to `document.body` with viewport-aware placement.
 */
export function TelemetryCardSettingsMenuShell({
  ariaLabel,
  children,
}: TelemetryCardSettingsMenuShellProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const { placement, panelRef } = useFixedMenuAnchor(open, triggerRef, "right");

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, panelRef]);

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const menuBody = typeof children === "function" ? children({ close }) : children;

  const menuPanel =
    open && portalTarget != null
      ? createPortal(
          <div
            ref={panelRef}
            className={`fixed z-10000 outline-none ${PANEL_WIDTH_CLASS}`}
            style={{
              top: placement?.top ?? -9999,
              left: placement?.left ?? -9999,
              visibility: placement?.positioned ? "visible" : "hidden",
              pointerEvents: placement?.positioned ? "auto" : "none",
            }}
            role="presentation"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <TRNMenuPanel tone="glass-dropdown" className="py-1">
              {menuBody}
            </TRNMenuPanel>
          </div>,
          portalTarget,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm p-0 text-zinc-400 transition-colors hover:text-zinc-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((value) => !value)}
      >
        <Settings2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      </button>
      {menuPanel}
    </>
  );
}
