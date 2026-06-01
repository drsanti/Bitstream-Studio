import { ChevronDown, LayoutTemplate } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { TRN_HINT_HOVER_DELAY_MS } from "../TRN/TRNHintText.js";
import {
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
} from "../TRN/TRNMenu.js";
import { TRNTooltip } from "../TRN/TRNTooltip.js";
import type { WorkbenchLayoutMenuProps } from "./workbench-layout-menu.types";

export function WorkbenchLayoutMenu({
  presets,
  namedLayouts,
  onLoadPreset,
  onLoadNamed,
  onSaveAs,
  onManage,
  onExportCurrent,
  onImport,
  onReset,
}: WorkbenchLayoutMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || rootRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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

  return (
    <div className="relative" ref={rootRef}>
      <TRNTooltip
        content="Presets, saved layouts, export/import"
        side="bottom"
        delayMs={TRN_HINT_HOVER_DELAY_MS}
      >
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          className={twMerge(
            "inline-flex items-center gap-1 rounded border border-sky-800/60 bg-sky-950/30 px-2 py-1 text-[11px] text-sky-100/90 hover:bg-sky-900/25",
          )}
          onClick={() => setOpen((value) => !value)}
        >
          <LayoutTemplate className="size-3 shrink-0 opacity-90" aria-hidden />
          Layout
          <ChevronDown className="size-3 shrink-0 opacity-70" aria-hidden />
        </button>
      </TRNTooltip>
      {open ? (
        <TRNMenuPanel
          tone="glass-dropdown"
          className="absolute right-0 top-full z-[70] mt-1 min-w-52 py-1 scrollbar-hide max-h-80 overflow-y-auto"
        >
          <div className="flex flex-col gap-0.5" role="menu">
            {presets.length > 0 ? (
              <>
                <TRNMenuSectionTitle spacing="menuFirst">Presets</TRNMenuSectionTitle>
                {presets.map((preset) => (
                  <TRNMenuItemButton
                    key={preset.id}
                    role="menuitem"
                    tone="glass-dropdown"
                    label={preset.label}
                    onClick={() => {
                      setOpen(false);
                      onLoadPreset(preset.id);
                    }}
                  />
                ))}
              </>
            ) : null}
            {namedLayouts.length > 0 ? (
              <>
                <TRNMenuSectionTitle spacing="menuNext">My layouts</TRNMenuSectionTitle>
                {namedLayouts.map((row) => (
                  <TRNMenuItemButton
                    key={row.id}
                    role="menuitem"
                    tone="glass-dropdown"
                    label={row.name}
                    onClick={() => {
                      setOpen(false);
                      onLoadNamed(row.id);
                    }}
                  />
                ))}
              </>
            ) : null}
            <TRNMenuSectionTitle spacing="menuNext">Layout library</TRNMenuSectionTitle>
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              label="Save current layout as…"
              onClick={() => {
                setOpen(false);
                onSaveAs();
              }}
            />
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              label="Manage layouts…"
              onClick={() => {
                setOpen(false);
                onManage();
              }}
            />
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              label="Export current layout…"
              onClick={() => {
                setOpen(false);
                onExportCurrent();
              }}
            />
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              label="Import layout…"
              onClick={() => {
                setOpen(false);
                onImport();
              }}
            />
            <TRNMenuSectionTitle spacing="menuNext">Reset</TRNMenuSectionTitle>
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              label="Reset to factory default"
              onClick={() => {
                setOpen(false);
                onReset();
              }}
            />
          </div>
        </TRNMenuPanel>
      ) : null}
    </div>
  );
}
