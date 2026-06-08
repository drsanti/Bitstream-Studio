import { useEffect } from "react";
import { readFlowInteractionTickGate } from "../core/runtime/flow-interaction-tick-gate";
import { buildLivePerformanceStats } from "../core/runtime/sensor-studio-performance-telemetry";
import { useFlowEditorStore } from "../features/editor/store/flow-editor.store";
import { useSensorStudioPerformanceStore } from "../state/sensor-studio-performance.store";
import { useStudioRuntimeVisibilityStore } from "../state/studio-runtime-visibility.store";

const REFRESH_MS = 1000;

/** Publishes rolling performance stats ~1×/sec for the inspector readout and shell chip. */
export function useSensorStudioLivePerformanceStats(): void {
  useEffect(() => {
    const refresh = () => {
      const visibility = useStudioRuntimeVisibilityStore.getState();
      const flow = useFlowEditorStore.getState();
      const prefs = useSensorStudioPerformanceStore.getState().preferences;
      const gate = readFlowInteractionTickGate();
      const documentHidden =
        typeof document !== "undefined" ? document.hidden : false;

      useSensorStudioPerformanceStore.getState().setLiveStats(
        buildLivePerformanceStats({
          flowSimulationMaxFps: prefs.flowSimulationMaxFps,
          flowTickEffectiveCap: gate.tickMaxFps,
          flowInteractionEditing: gate.editingActive,
          flowInteractionPaused: gate.blocked,
          flowInteractionActiveKind: gate.activeKind,
          documentHidden,
          flowPaneVisible: visibility.flowPaneVisible,
          dashboardPaneVisible: visibility.dashboardPaneVisible,
          stagePaneVisible: visibility.stagePaneVisible,
          nodeCount: flow.nodes.length,
          edgeCount: flow.edges.length,
        }),
      );
    };

    refresh();
    const id = window.setInterval(refresh, REFRESH_MS);
    const onVisibilityChange = () => refresh();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
}
