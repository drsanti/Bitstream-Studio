import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Cpu,
  Download,
  FolderKanban,
  LayoutGrid,
  LayoutTemplate,
  Maximize2,
  Minimize2,
  PanelRightOpen,
  RotateCcw,
  Rows3,
  Save,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";

/** Half-radius vs default glass `TRNMenuPanel` (`rounded-xl` → `rounded-md`). */
export const WORKBENCH_LAYOUT_MENU_PANEL_CLASS =
  "min-w-52 max-h-80 overflow-y-auto scrollbar-hide rounded-md px-1 py-0.5";

/** Denser rows than default `TRNMenuItemButton` (`rounded-md` → `rounded-sm`). */
export const WORKBENCH_LAYOUT_MENU_ITEM_CLASS =
  "gap-1.5 rounded-sm px-2 py-1 text-[13px] leading-tight";

export function workbenchLayoutMenuIcon(Icon: LucideIcon): ReactNode {
  return <Icon className="size-3.5 shrink-0 text-zinc-400" aria-hidden />;
}

export function workbenchLayoutPresetIcon(presetId: string): ReactNode {
  switch (presetId) {
    case "default":
      return workbenchLayoutMenuIcon(LayoutGrid);
    case "deck-focus":
      return workbenchLayoutMenuIcon(Rows3);
    case "bring-up":
      return workbenchLayoutMenuIcon(Cpu);
    case "graph-focus":
      return workbenchLayoutMenuIcon(Maximize2);
    case "inspector-wide":
      return workbenchLayoutMenuIcon(PanelRightOpen);
    case "minimal":
      return workbenchLayoutMenuIcon(Minimize2);
    default:
      return workbenchLayoutMenuIcon(LayoutTemplate);
  }
}

export const WORKBENCH_LAYOUT_MENU_ICONS = {
  namedLayout: Bookmark,
  saveAs: Save,
  manage: FolderKanban,
  exportCurrent: Download,
  importLayout: Upload,
  reset: RotateCcw,
} as const;
