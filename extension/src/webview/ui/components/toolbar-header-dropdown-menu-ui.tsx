import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Compact glass dropdown panel (half radius vs default `TRNMenuPanel` glass). */
export const TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS =
  "min-w-48 max-h-80 overflow-y-auto scrollbar-hide rounded-md px-1 py-0.5";

/** Denser menu rows (`rounded-sm`, tighter padding). */
export const TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS =
  "gap-1.5 rounded-sm px-2 py-1 text-[13px] leading-tight";

export function toolbarHeaderDropdownMenuIcon(Icon: LucideIcon): ReactNode {
  return <Icon className="size-3.5 shrink-0 text-zinc-400" aria-hidden />;
}
