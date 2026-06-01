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
import {
  TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS,
  TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS,
  toolbarHeaderDropdownMenuIcon,
} from "../components/toolbar-header-dropdown-menu-ui";

export const WORKBENCH_LAYOUT_MENU_PANEL_CLASS = TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS;
export const WORKBENCH_LAYOUT_MENU_ITEM_CLASS = TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS;

export const workbenchLayoutMenuIcon = toolbarHeaderDropdownMenuIcon;

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
} as const satisfies Record<string, LucideIcon>;
