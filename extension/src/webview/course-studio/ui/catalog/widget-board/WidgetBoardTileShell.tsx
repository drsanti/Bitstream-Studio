import type { ReactNode } from "react";
import type { WidgetBoardTileLayoutConfig } from "./widgetBoardReadoutLayout";
import { widgetBoardTileShellClassName } from "./widgetBoardReadoutLayout";

export function WidgetBoardTileShell({
  tileContentH = "center",
  tileContentV = "center",
  className = "",
  kind,
  stale = false,
  children,
}: WidgetBoardTileLayoutConfig & {
  className?: string;
  kind?: string;
  stale?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`${widgetBoardTileShellClassName({ tileContentH, tileContentV })} ${
        stale ? "course-widget-board-entry--stale" : ""
      } ${className}`.trim()}
      data-course-widget-kind={kind}
    >
      {children}
    </div>
  );
}
