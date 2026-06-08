import { useMemo } from "react";
import type { DashboardWidgetEntryV1 } from "../../core/dashboard/dashboard-snapshot";
import { readFlowGraphStoreStructuralRevision } from "../editor/flow-graph-store-revisions";
import { PlotterCanvas } from "../editor/nodes/plotter/PlotterCanvas";
import { resolvePlotterChannelColors } from "../editor/nodes/plotter/plotter-channel-colors";
import { coercePlotterConfig, PLOTTER_INPUT_IDS } from "../editor/nodes/plotter/plotter-config";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";

type DashboardPlotterWidgetBodyProps = {
  widget: DashboardWidgetEntryV1;
  livePlotHistory?: Readonly<Record<string, readonly number[]>>;
  shellClassName?: string;
};

export function DashboardPlotterWidgetBody(props: DashboardPlotterWidgetBodyProps) {
  const { widget, livePlotHistory, shellClassName } = props;
  const graphStructuralRevision = useFlowEditorStore((s) =>
    readFlowGraphStoreStructuralRevision(s.nodes, s.edges),
  );
  const plotterConfig = coercePlotterConfig(widget.style);
  const channelOrder = widget.plotterChannelOrder ?? PLOTTER_INPUT_IDS;

  const channelColors = useMemo(() => {
    const state = useFlowEditorStore.getState();
    return resolvePlotterChannelColors({
      plotterFlowNodeId: widget.sourceNodeId,
      config: plotterConfig,
      edges: state.edges,
      nodes: state.nodes,
    });
  }, [widget.sourceNodeId, plotterConfig, graphStructuralRevision]);

  const histories: Record<string, number[]> = {};
  const plotSource = livePlotHistory ?? widget.livePlotHistory;
  for (const id of channelOrder) {
    const series = plotSource?.[id];
    if (series != null) {
      histories[id] = [...series];
    }
  }

  return (
    <div
      className={
        shellClassName ??
        "flex h-full min-h-[var(--dashboard-row-height,160px)] w-full overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-900/50"
      }
    >
      <PlotterCanvas
        className="relative box-border h-full min-h-0 w-full min-w-0 flex-1"
        histories={histories}
        channelOrder={channelOrder}
        config={plotterConfig}
        channelColors={channelColors}
      />
    </div>
  );
}
