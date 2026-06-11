import { Plus, Trash2 } from "lucide-react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import type { WidgetBoardWidgetKind } from "../../schemas/widgetBoard.v1";
import { WIDGET_BOARD_PALETTE } from "./widgetBoardPaletteMeta";

export function CourseWidgetBoardEditorToolbar({
  onAddWidget,
  onDeleteSelected,
  canDeleteSelected,
}: {
  onAddWidget: (kind: WidgetBoardWidgetKind) => void;
  onDeleteSelected: () => void;
  canDeleteSelected: boolean;
}) {
  return (
    <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[var(--surface-border)] bg-[var(--surface-bg)] px-2 py-1.5">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Add widget
      </span>
      {WIDGET_BOARD_PALETTE.map((entry) => (
        <TRNButton
          key={entry.kind}
          variant="secondary"
          size="compact"
          className="h-7 gap-1 px-2 text-[11px]"
          hint={entry.description}
          onClick={() => onAddWidget(entry.kind)}
        >
          <Plus className="h-3 w-3 shrink-0" aria-hidden />
          {entry.label}
        </TRNButton>
      ))}
      <div className="ml-auto">
        <TRNButton
          variant="secondary"
          size="compact"
          className="h-7 gap-1 px-2 text-[11px]"
          disabled={!canDeleteSelected}
          hint="Remove the selected inner widget (board keeps at least one)."
          onClick={onDeleteSelected}
        >
          <Trash2 className="h-3 w-3 shrink-0" aria-hidden />
          Delete widget
        </TRNButton>
      </div>
    </div>
  );
}
