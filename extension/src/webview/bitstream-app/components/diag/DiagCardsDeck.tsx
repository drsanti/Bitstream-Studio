import { TRNSortableContainer, TRNSortableItem } from "@/ui/TRN";
import { useCallback, useState } from "react";
import { DiagControlPanel } from "./DiagControlPanel";
import { DiagSnapshotPanel } from "./DiagSnapshotPanel";
import { DiagTaskTablePanel } from "./DiagTaskTablePanel";

export type DiagCardId = "diag-control" | "diag-snapshot" | "diag-task-table";

// Default: show Global snapshot first (low bandwidth, independent),
// then control (streaming knobs), then Task table (high bandwidth).
const DEFAULT_ORDER: DiagCardId[] = ["diag-snapshot", "diag-control", "diag-task-table"];

/**
 * Sortable (drag-reorder) stack of diagnostics cards with independent collapse state.
 * `TRNDragHandle` in each card must render under the matching `TRNSortableItem` (see card components).
 */
export function DiagCardsDeck() {
  const [cardOrder, setCardOrder] = useState<DiagCardId[]>(DEFAULT_ORDER);
  const [diagnosticsStreamEnabled, setDiagnosticsStreamEnabled] = useState(false);
  /** Expanded by default: `DiagCardsDeck` only mounts inside the System Diagnostics window (remounts each open). */
  const [collapsed, setCollapsed] = useState<Record<DiagCardId, boolean>>({
    "diag-control": false,
    "diag-snapshot": false,
    "diag-task-table": false,
  });

  const onCollapsedControl = useCallback((next: boolean) => {
    setCollapsed((previous) => ({ ...previous, "diag-control": next }));
  }, []);
  const onCollapsedSnapshot = useCallback((next: boolean) => {
    setCollapsed((previous) => ({ ...previous, "diag-snapshot": next }));
  }, []);
  const onCollapsedTaskTable = useCallback((next: boolean) => {
    setCollapsed((previous) => ({ ...previous, "diag-task-table": next }));
  }, []);

  return (
    <TRNSortableContainer
      itemIds={[...cardOrder]}
      onReorder={(nextItemIds) => setCardOrder(nextItemIds as DiagCardId[])}
      className="flex flex-col gap-2"
    >
      {cardOrder.map((id) => (
        <TRNSortableItem
          key={id}
          id={id}
          className="min-w-0 w-full"
          dragFx="playful"
          dragFxOptions={{
            normalizeScale: true,
            playfulScale: 1,
            playfulMaxRotateDeg: 3,
          }}
        >
          {id === "diag-control" ? (
            <DiagControlPanel
              collapsed={collapsed["diag-control"]}
              onCollapsedChange={onCollapsedControl}
              onDiagnosticsStreamEnabledChange={setDiagnosticsStreamEnabled}
            />
          ) : id === "diag-snapshot" ? (
            <DiagSnapshotPanel
              collapsed={collapsed["diag-snapshot"]}
              onCollapsedChange={onCollapsedSnapshot}
              diagnosticsStreamEnabled={diagnosticsStreamEnabled}
            />
          ) : (
            <DiagTaskTablePanel
              collapsed={collapsed["diag-task-table"]}
              onCollapsedChange={onCollapsedTaskTable}
              diagnosticsStreamEnabled={diagnosticsStreamEnabled}
            />
          )}
        </TRNSortableItem>
      ))}
    </TRNSortableContainer>
  );
}
