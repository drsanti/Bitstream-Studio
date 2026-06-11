import { ArrowDownUp, Columns2, Rows2 } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { TRNIconButton } from "../../../../../ui/TRN";
import { WorkbenchOrientedSplit } from "../../../../../ui/workbench/WorkbenchOrientedSplit";
import {
  readInspectorDualPaneLayout,
  writeInspectorDualPaneLayout,
  type InspectorDualPaneLayout,
} from "./inspector-dual-pane-ui-persistence";

export type InspectorPaneRole = "pinned" | "active";

export function InspectorPaneHeader(props: {
  role: InspectorPaneRole;
  label: string;
}) {
  const { role, label } = props;
  const isPinned = role === "pinned";
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800/70 bg-zinc-950/60 px-2 py-1">
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
          isPinned
            ? "bg-amber-950/50 text-amber-300/95"
            : "bg-zinc-800/70 text-zinc-400"
        }`}
      >
        {isPinned ? "Pinned" : "Active"}
      </span>
      <span className="min-w-0 truncate text-[11px] font-medium text-zinc-200">{label}</span>
    </div>
  );
}

function InspectorDualPaneToolbar(props: {
  layout: InspectorDualPaneLayout;
  onLayoutChange: (patch: Partial<InspectorDualPaneLayout>) => void;
}) {
  const { layout, onLayoutChange } = props;
  const isVertical = layout.direction === "vertical";

  return (
    <div className="mb-2 flex shrink-0 items-center justify-end gap-0.5">
      <TRNIconButton
        icon={<ArrowDownUp className="size-3.5" aria-hidden />}
        label="Swap pinned and active panes"
        hint="Swap which pane is first (top/left vs bottom/right)"
        variant="ghost"
        nativeTitle={false}
        onClick={() => onLayoutChange({ pinnedFirst: !layout.pinnedFirst })}
      />
      <TRNIconButton
        icon={
          isVertical ? (
            <Columns2 className="size-3.5" aria-hidden />
          ) : (
            <Rows2 className="size-3.5" aria-hidden />
          )
        }
        label={isVertical ? "Side-by-side layout" : "Stacked layout"}
        hint={
          isVertical
            ? "Place panes side by side (horizontal split)"
            : "Stack panes vertically (horizontal split off)"
        }
        variant="ghost"
        nativeTitle={false}
        onClick={() =>
          onLayoutChange({
            direction: isVertical ? "horizontal" : "vertical",
          })
        }
      />
    </div>
  );
}

export type InspectorDualPaneShellProps = {
  pinnedLabel: string;
  activeLabel: string;
  pinnedPane: ReactNode;
  activePane: ReactNode;
};

export function InspectorDualPaneShell(props: InspectorDualPaneShellProps) {
  const { pinnedLabel, activeLabel, pinnedPane, activePane } = props;
  const [layout, setLayout] = useState<InspectorDualPaneLayout>(() => readInspectorDualPaneLayout());

  const onLayoutChange = useCallback((patch: Partial<InspectorDualPaneLayout>) => {
    setLayout((current) => {
      const next = { ...current, ...patch };
      writeInspectorDualPaneLayout(next);
      return next;
    });
  }, []);

  const pinnedHeader = <InspectorPaneHeader role="pinned" label={pinnedLabel} />;
  const activeHeader = <InspectorPaneHeader role="active" label={activeLabel} />;

  const firstPane = layout.pinnedFirst ? pinnedPane : activePane;
  const secondPane = layout.pinnedFirst ? activePane : pinnedPane;
  const firstHeader = layout.pinnedFirst ? pinnedHeader : activeHeader;
  const secondHeader = layout.pinnedFirst ? activeHeader : pinnedHeader;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <InspectorDualPaneToolbar layout={layout} onLayoutChange={onLayoutChange} />
      <WorkbenchOrientedSplit
        direction={layout.direction}
        first={firstPane}
        second={secondPane}
        firstHeader={firstHeader}
        secondHeader={secondHeader}
        readPrimaryRatio={() => layout.primaryRatio}
        writePrimaryRatio={(ratio) => onLayoutChange({ primaryRatio: ratio })}
      />
    </div>
  );
}
