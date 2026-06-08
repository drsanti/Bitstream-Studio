import type { DashboardLayoutModeV1 } from "../../core/dashboard/dashboard-layout";

export function dashboardPreviewRadiusClass(
  editMode: boolean,
  options?: { nestedInGroup?: boolean },
): string {
  if (editMode) {
    return "";
  }
  return options?.nestedInGroup ? "rounded-md" : "rounded-lg";
}

/** Bordered widget body — radius matches the outer shell in Preview / Operator. */
export function dashboardWidgetPanelClass(
  editMode: boolean,
  options?: { nestedInGroup?: boolean },
): string {
  const radius = dashboardPreviewRadiusClass(editMode, options);
  return ["h-full w-full overflow-hidden border border-zinc-700/50 bg-zinc-900/50", radius]
    .filter(Boolean)
    .join(" ");
}

/** Edit-mode widget shell — flush to grid when selected; rounded in Preview / Operator. */
export function dashboardGridEditChromeClass(
  editMode: boolean,
  highlighted: boolean,
  options?: { dragging?: boolean; gridLayout?: boolean; nestedInGroup?: boolean },
): string {
  const base = "relative min-h-0 min-w-0 overflow-hidden touch-none";
  if (!editMode) {
    return `${base} ${dashboardPreviewRadiusClass(editMode, options)}`.trim();
  }
  const dragCursor =
    options?.gridLayout === true
      ? options.dragging
        ? "cursor-grabbing"
        : "cursor-grab"
      : "";
  if (highlighted) {
    return `${base} rounded-none bg-cyan-500/[0.06] shadow-[inset_0_0_0_2px_rgba(34,211,238,0.75)] ${
      options?.dragging ? "opacity-90" : ""
    } ${dragCursor}`.trim();
  }
  return `${base} rounded-sm ring-1 ring-zinc-500/55 hover:ring-2 hover:ring-cyan-400/45 hover:bg-cyan-500/[0.03] ${dragCursor}`.trim();
}

export function dashboardGroupEditChromeClass(
  editMode: boolean,
  highlighted: boolean,
  layoutMode: DashboardLayoutModeV1,
  showBorder: boolean,
  options?: { dragging?: boolean },
): string {
  const base = "relative flex min-h-0 min-w-0 flex-col overflow-hidden touch-none";
  const border = showBorder ? "border border-zinc-700/60" : "";
  const dragCursor =
    layoutMode === "grid"
      ? options?.dragging
        ? "cursor-grabbing"
        : "cursor-grab"
      : "";
  if (!editMode) {
    return `${base} rounded-lg ${border}`.trim();
  }
  if (layoutMode === "grid" && highlighted) {
    return `${base} rounded-none bg-cyan-500/[0.06] shadow-[inset_0_0_0_2px_rgba(34,211,238,0.75)] ${
      options?.dragging ? "opacity-90" : ""
    } ${border} ${dragCursor}`.trim();
  }
  return `${base} rounded-sm ring-1 ring-zinc-500/50 hover:ring-2 hover:ring-cyan-400/40 hover:bg-cyan-500/[0.03] ${border} ${dragCursor}`.trim();
}
