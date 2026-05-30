import { Check, PanelsTopLeft, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useProject4HudPanelVisibility } from "../../hooks/useProject4HudPanelVisibility";
import {
  PROJECT4_HUD_PANEL_IDS,
  type Project4HudPersistPanelId,
} from "../../lib/project4-hud-layout";
import { TRNIconButton } from "../../../ui/TRN/TRNIconButton";
import { TRNMenuItemButton, TRNMenuPanel, TRNMenuSectionTitle } from "../../../ui/TRN/TRNMenu";

const LABELS: Record<Project4HudPersistPanelId, string> = {
  connection: "Connection",
  telemetry: "Telemetry",
  motion: "Motion / speed",
  mcuCard: "MCU telemetry card",
};

export type Project4HudPanelMenuProps = {
  /**
   * Clears saved `TRNWindow` geometry and restores default open/closed flags (Copilot open;
   * Help + setup dialogs closed), persisted under **`ternion.project4.overlayWindows.visibility.v1`**.
   */
  onResetFloatingWindowLayouts?: () => void;
};

/**
 * Toolbar menu — toggle visibility of draggable HUD tiles (persisted under **`ternion.project4.hudLayout.v1`**).
 */
export function Project4HudPanelMenu(props: Project4HudPanelMenuProps) {
  const { onResetFloatingWindowLayouts } = props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { togglePanel, isHidden } = useProject4HudPanelVisibility();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (evt: PointerEvent): void => {
      const root = rootRef.current;
      if (root == null) {
        return;
      }
      const t = evt.target;
      if (t instanceof Node && !root.contains(t)) {
        setOpen(false);
      }
    };
    const onKeyDown = (evt: KeyboardEvent): void => {
      if (evt.key === "Escape") {
        evt.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menuPanel = open ? (
    <div className="pointer-events-auto absolute left-1/2 top-full z-90 mt-1 min-w-52 max-w-[min(92vw,18rem)] -translate-x-1/2">
      <TRNMenuPanel tone="glass-dropdown" className="border-zinc-700/90 bg-zinc-950/96 shadow-[0_16px_48px_rgba(0,0,0,0.75)] ring-black/45 backdrop-blur-xl">
        <TRNMenuSectionTitle spacing="hud">Overlay panels</TRNMenuSectionTitle>
        <div className="flex flex-col gap-1" role="menu">
          {PROJECT4_HUD_PANEL_IDS.map((id) => {
            const visible = !isHidden(id);
            return (
              <TRNMenuItemButton
                key={id}
                tone="glass-dropdown"
                role="menuitemcheckbox"
                aria-checked={visible}
                label={LABELS[id]}
                className="border-zinc-700/70 bg-zinc-900/80 px-3.5 py-2.5 text-xs text-zinc-100 hover:bg-zinc-800/85"
                rightSlot={
                  visible ? (
                    <Check className="h-4 w-4 text-emerald-400/95" strokeWidth={2.5} aria-hidden />
                  ) : null
                }
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePanel(id);
                }}
              />
            );
          })}
        </div>
        <p className="mt-1.5 border-t border-white/8 px-3 pb-1 pt-1.5 text-[9px] leading-snug text-zinc-500">
          Closed tiles stay saved — reopen anytime from here.
        </p>
        {onResetFloatingWindowLayouts != null ? (
          <>
            <TRNMenuSectionTitle spacing="hudFollowUp">
              Floating windows
            </TRNMenuSectionTitle>
            <div className="flex flex-col gap-1 px-2 pb-2 pt-0.5" role="menu">
              <TRNMenuItemButton
                tone="glass-dropdown"
                role="menuitem"
                label="Reset floating windows"
                className="border-zinc-700/70 bg-zinc-900/80 px-3.5 py-2.5 text-xs text-zinc-100 hover:bg-zinc-800/85"
                rightSlot={
                  <RotateCcw className="h-4 w-4 text-zinc-400/90" strokeWidth={2.25} aria-hidden />
                }
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onResetFloatingWindowLayouts();
                  setOpen(false);
                }}
              />
            </div>
            <p className="border-t border-white/8 px-3 pb-2 pt-1 text-[9px] leading-snug text-zinc-500">
              Clears saved positions/sizes and restores defaults: Copilot open, Help and setup dialogs closed.
              HUD tile layout is unchanged.
            </p>
          </>
        ) : null}
      </TRNMenuPanel>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative inline-block pointer-events-auto">
      <TRNIconButton
        type="button"
        label="HUD overlay panels — show or hide floating tiles"
        icon={<PanelsTopLeft className="h-4 w-4 text-zinc-200" strokeWidth={2} />}
        aria-haspopup="menu"
        aria-expanded={open}
        className={twMerge(
          "pointer-events-auto border border-zinc-700/80 bg-zinc-900/95 text-zinc-200 shadow-md ring-1 ring-black/40 backdrop-blur-sm hover:bg-zinc-800/95",
        )}
        onClick={() => setOpen((v) => !v)}
      />
      {menuPanel}
    </div>
  );
}
