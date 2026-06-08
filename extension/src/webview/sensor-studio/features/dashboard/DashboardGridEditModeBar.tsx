import { MousePointerClick, X } from "lucide-react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import type { DashboardPlacementV1 } from "../../core/dashboard/dashboard-placement";

type DashboardGridEditModeBarProps = {
  selectedLabel: string | null;
  selectedKind: "widget" | "group" | null;
  placement: DashboardPlacementV1 | null;
  isDragging: boolean;
  isResizing: boolean;
  onDeselect: () => void;
};

function formatPlacement(placement: DashboardPlacementV1): string {
  return `col ${placement.column}, row ${placement.row} · ${placement.columnSpan}×${placement.rowSpan}`;
}

export function DashboardGridEditModeBar(props: DashboardGridEditModeBarProps) {
  const {
    selectedLabel,
    selectedKind,
    placement,
    isDragging,
    isResizing,
    onDeselect,
  } = props;

  const hasSelection = selectedLabel != null && placement != null;

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5">
      {hasSelection ? (
        <>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="shrink-0 rounded border border-cyan-400/35 bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-100">
              {selectedKind === "group" ? "Group" : "Widget"}
            </span>
            <span className="truncate text-[12px] font-medium text-zinc-100">{selectedLabel}</span>
            <span className="text-[11px] text-zinc-400">{formatPlacement(placement)}</span>
          </div>
          <TRNHintText className="hidden min-w-0 flex-[2] text-cyan-100/80 sm:block">
            {isResizing
              ? "Release to apply size."
              : isDragging
                ? "Release to place on the grid."
                : "Drag the widget body to move. Drag cyan handles to resize. Press Esc to deselect."}
          </TRNHintText>
          <TRNButton
            type="button"
            size="compact"
            hint="Clear selection"
            onClick={onDeselect}
          >
            <X className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
            Deselect
          </TRNButton>
        </>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <MousePointerClick className="size-3.5 shrink-0 text-cyan-300/80" aria-hidden />
          <TRNHintText className="text-cyan-100/85">
            Click a widget or group to select it. Then drag to move or use the cyan handles to
            resize. Click empty grid space or press Esc to deselect.
          </TRNHintText>
        </div>
      )}
    </div>
  );
}
