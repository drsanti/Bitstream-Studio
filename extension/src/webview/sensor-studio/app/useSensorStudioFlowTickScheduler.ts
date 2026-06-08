import { useEffect, useRef } from "react";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store";
import { useBmi270FusionEulerWireTapStore } from "../../bitstream-app/state/bmi270FusionEulerWireTap.store";
import { useBmi270FusionQuatWireTapStore } from "../../bitstream-app/state/bmi270FusionQuatWireTap.store";
import { graphNeedsGeometryDomainEvalInGraph } from "../core/flow/geometry-domain-eval";
import { graphNeedsMaterialDomainEvalInGraph } from "../core/flow/material-domain-eval";
import {
  graphNeedsAudioFrameTick,
  graphNeedsCameraFrameTick,
  graphNeedsSceneFrameTickInDocument,
} from "../core/flow/scene-flow-frame-subscribers";
import { readFlowInteractionTickGate } from "../core/runtime/flow-interaction-tick-gate";
import {
  minFrameIntervalMs,
  shouldRunCappedFrame,
} from "../persistence/sensor-studio-performance-preferences";
import { graphHasSceneOutputNodeInDocument } from "../core/stage/evaluate-stage-scene-snapshot";
import { useFlowEditorStore } from "../features/editor/store/flow-editor.store";
import {
  recordFlowSimulationTick,
  setFlowSceneLoopActive,
} from "../core/runtime/sensor-studio-performance-telemetry";
import { useSensorStudioPerformanceStore } from "../state/sensor-studio-performance.store";
import { useStudioRuntimeVisibilityStore } from "../state/studio-runtime-visibility.store";

/**
 * Domain A + B tick scheduler for Sensor Studio.
 *
 * - **Telemetry (A):** `sampleCount` and BMI270 wire taps coalesce into one rAF `tickSimulation`.
 * - **Scene frame (B):** continuous rAF while the graph has preview / time-source nodes — independent of UART.
 *
 * See `docs/FLOW_DOMAINS.md` (Phase 1).
 */
export function useSensorStudioFlowTickScheduler(tickSimulation: () => boolean): void {
  const tickRef = useRef(tickSimulation);
  tickRef.current = tickSimulation;

  useEffect(() => {
    let coalescedRafId = 0;
    let sceneFrameLoopId = 0;
    let sceneLoopRunning = false;
    let lastFlowTickMs = 0;

    let prevSampleCount = useBitstreamLiveStore.getState().sampleCount;
    let prevQuatSeq = useBmi270FusionQuatWireTapStore.getState().seq;
    let prevEulerSeq = useBmi270FusionEulerWireTapStore.getState().seq;

    const runTick = () => {
      const t0 = performance.now();
      const didMutate = tickRef.current();
      if (!didMutate) {
        return;
      }
      recordFlowSimulationTick(performance.now() - t0, t0);
    };

    const scheduleTick = () => {
      if (coalescedRafId !== 0) {
        return;
      }
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      coalescedRafId = window.requestAnimationFrame(() => {
        coalescedRafId = 0;
        if (typeof document !== "undefined" && document.hidden) {
          return;
        }
        const gate = readFlowInteractionTickGate();
        const minIntervalMs = minFrameIntervalMs(gate.tickMaxFps);
        const nowMs = performance.now();
        if (!shouldRunCappedFrame(nowMs, lastFlowTickMs, minIntervalMs)) {
          scheduleTick();
          return;
        }
        runTick();
        lastFlowTickMs = performance.now();
      });
    };

    const stopSceneLoop = () => {
      if (sceneFrameLoopId !== 0) {
        window.cancelAnimationFrame(sceneFrameLoopId);
        sceneFrameLoopId = 0;
      }
      sceneLoopRunning = false;
      setFlowSceneLoopActive(false);
    };

    const graphNeedsContinuousFlowTick = () => {
      const st = useFlowEditorStore.getState();
      return (
        graphNeedsSceneFrameTickInDocument({
          nodes: st.nodes,
          rootNodes: st.rootNodes,
          subgraphs: st.subgraphs,
        }) ||
        graphNeedsAudioFrameTick(st.nodes) ||
        graphNeedsCameraFrameTick(st.nodes) ||
        graphHasSceneOutputNodeInDocument({
          nodes: st.nodes,
          rootNodes: st.rootNodes,
          subgraphs: st.subgraphs,
        }) ||
        graphNeedsMaterialDomainEvalInGraph({
          nodes: st.nodes,
          rootNodes: st.rootNodes,
          subgraphs: st.subgraphs,
        }) ||
        graphNeedsGeometryDomainEvalInGraph({
          nodes: st.nodes,
          rootNodes: st.rootNodes,
          subgraphs: st.subgraphs,
        })
      );
    };

    const hasVisibleFlowTickConsumer = () => {
      const visibility = useStudioRuntimeVisibilityStore.getState();
      return (
        visibility.flowPaneVisible ||
        visibility.dashboardPaneVisible ||
        visibility.stagePaneVisible
      );
    };

    const sceneFrameLoop = () => {
      if (typeof document !== "undefined" && document.hidden) {
        stopSceneLoop();
        return;
      }
      if (!graphNeedsContinuousFlowTick() || !hasVisibleFlowTickConsumer()) {
        stopSceneLoop();
        return;
      }
      scheduleTick();
      sceneFrameLoopId = window.requestAnimationFrame(sceneFrameLoop);
    };

    const ensureSceneLoop = () => {
      if (sceneLoopRunning) {
        return;
      }
      if (!graphNeedsContinuousFlowTick()) {
        return;
      }
      sceneLoopRunning = true;
      setFlowSceneLoopActive(true);
      sceneFrameLoopId = window.requestAnimationFrame(sceneFrameLoop);
    };

    const unsubscribeLive = useBitstreamLiveStore.subscribe((state) => {
      if (state.sampleCount !== prevSampleCount) {
        prevSampleCount = state.sampleCount;
        scheduleTick();
      }
    });
    const unsubscribeQuatWire = useBmi270FusionQuatWireTapStore.subscribe((state) => {
      if (state.seq !== prevQuatSeq) {
        prevQuatSeq = state.seq;
        scheduleTick();
      }
    });
    const unsubscribeEulerWire = useBmi270FusionEulerWireTapStore.subscribe((state) => {
      if (state.seq !== prevEulerSeq) {
        prevEulerSeq = state.seq;
        scheduleTick();
      }
    });
    const unsubscribeGraph = useFlowEditorStore.subscribe(() => {
      ensureSceneLoop();
    });
    const unsubscribeVisibility = useStudioRuntimeVisibilityStore.subscribe(() => {
      ensureSceneLoop();
    });
    const unsubscribePerformance = useSensorStudioPerformanceStore.subscribe(() => {
      lastFlowTickMs = 0;
    });

    const onVisibilityChange = () => {
      if (typeof document !== "undefined" && document.hidden) {
        stopSceneLoop();
        if (coalescedRafId !== 0) {
          window.cancelAnimationFrame(coalescedRafId);
          coalescedRafId = 0;
        }
        return;
      }
      ensureSceneLoop();
      scheduleTick();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    ensureSceneLoop();
    scheduleTick();

    return () => {
      unsubscribeLive();
      unsubscribeQuatWire();
      unsubscribeEulerWire();
      unsubscribeGraph();
      unsubscribeVisibility();
      unsubscribePerformance();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopSceneLoop();
      if (coalescedRafId !== 0) {
        window.cancelAnimationFrame(coalescedRafId);
      }
    };
  }, []);
}
