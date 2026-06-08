import { useMemo } from "react";
import type { DashboardWidgetEntryV1 } from "../../core/dashboard/dashboard-snapshot";
import { useFlowNodeLiveStore } from "../editor/store/flow-node-live.store";

export type DashboardWidgetLiveView = {
  liveValue: number | boolean | string | null;
  liveHistory?: readonly number[];
  livePlotHistory?: Readonly<Record<string, readonly number[]>>;
  sensorHealth?: DashboardWidgetEntryV1["sensorHealth"];
};

/** Per-widget live telemetry — decoupled from dashboard structural snapshot refresh. */
export function useDashboardWidgetLive(
  widget: DashboardWidgetEntryV1,
): DashboardWidgetLiveView {
  const liveSlice = useFlowNodeLiveStore((s) => s.byNodeId[widget.sourceNodeId]);
  return useMemo((): DashboardWidgetLiveView => {
    if (liveSlice == null) {
      return {
        liveValue: widget.liveValue,
        liveHistory: widget.liveHistory,
        livePlotHistory: widget.livePlotHistory,
        sensorHealth: widget.sensorHealth,
      };
    }
    return {
      liveValue:
        liveSlice.liveValue !== undefined ? liveSlice.liveValue : widget.liveValue,
      liveHistory: liveSlice.liveHistory ?? widget.liveHistory,
      livePlotHistory: liveSlice.livePlotHistory ?? widget.livePlotHistory,
      sensorHealth: liveSlice.sensorHealth ?? widget.sensorHealth,
    };
  }, [liveSlice, widget.liveHistory, widget.livePlotHistory, widget.liveValue, widget.sensorHealth]);
}
