import { Activity, Box, ScrollText, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toolbarHeaderDropdownMenuIcon } from "../ui/components/toolbar-header-dropdown-menu-ui";

export function telemetryPaneMenuIcon(editorType: string): ReactNode {
  const Icon = TELEMETRY_PANE_MENU_ICONS[editorType] ?? Settings;
  return toolbarHeaderDropdownMenuIcon(Icon);
}

const TELEMETRY_PANE_MENU_ICONS: Record<string, LucideIcon> = {
  config: Settings,
  main: Box,
  telemetry: Activity,
  activity: ScrollText,
};
