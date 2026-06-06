import { useEffect, useRef } from "react";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store";
import { useBmi270FusionEulerWireTapStore } from "../../bitstream-app/state/bmi270FusionEulerWireTap.store";
import { useBmi270FusionQuatWireTapStore } from "../../bitstream-app/state/bmi270FusionQuatWireTap.store";
import { graphNeedsMaterialDomainEvalInGraph } from "../core/flow/material-domain-eval";
import {
  graphNeedsAudioFrameTick,
  graphNeedsCameraFrameTick,
  graphNeedsSceneFrameTick,
} from "../core/flow/scene-flow-frame-subscribers";
import { graphHasSceneOutputNode } from "../core/stage/evaluate-stage-scene-snapshot";
import { useFlowEditorStore } from "../features/editor/store/flow-editor.store";

/**
 * Domain A + B tick scheduler for Sensor Studio.
 *
 * - **Telemetry (A):** `sampleCount` and BMI270 wire taps coalesce into one rAF `tickSimulation`.
 * - **Scene frame (B):** continuous rAF while the graph has preview / time-source nodes — independent of UART.
 *
 * See `docs/FLOW_DOMAINS.md` (Phase 1).
 */
export function useSensorStudioFlowTickScheduler(tickSimulation: () => void): void {
  const tickRef = useRef(tickSimulation);
  tickRef.current = tickSimulation;

  useEffect(() => {
    let coalescedRafId = 0;
    let sceneFrameLoopId = 0;
    let sceneLoopRunning = false;

    let prevSampleCount = useBitstreamLiveStore.getState().sampleCount;
    let prevQuatSeq = useBmi270FusionQuatWireTapStore.getState().seq;
    let prevEulerSeq = useBmi270FusionEulerWireTapStore.getState().seq;

    const runTick = () => {
      tickRef.current();
    };

    const scheduleTick = () => {
      if (coalescedRafId !== 0) {
        return;
      }
      coalescedRafId = window.requestAnimationFrame(() => {
        coalescedRafId = 0;
        runTick();
      });
    };

    const stopSceneLoop = () => {
      if (sceneFrameLoopId !== 0) {
        window.cancelAnimationFrame(sceneFrameLoopId);
        sceneFrameLoopId = 0;
      }
      sceneLoopRunning = false;
    };

    const graphNeedsContinuousFlowTick = () => {
      const st = useFlowEditorStore.getState();
      return (
        graphNeedsSceneFrameTick(st.nodes) ||
        graphNeedsAudioFrameTick(st.nodes) ||
        graphNeedsCameraFrameTick(st.nodes) ||
        graphHasSceneOutputNode(st.nodes) ||
        graphNeedsMaterialDomainEvalInGraph({
          nodes: st.nodes,
          rootNodes: st.rootNodes,
          subgraphs: st.subgraphs,
        })
      );
    };

    const sceneFrameLoop = () => {
      if (!graphNeedsContinuousFlowTick()) {
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

    ensureSceneLoop();
    runTick();

    return () => {
      unsubscribeLive();
      unsubscribeQuatWire();
      unsubscribeEulerWire();
      unsubscribeGraph();
      stopSceneLoop();
      if (coalescedRafId !== 0) {
        window.cancelAnimationFrame(coalescedRafId);
      }
    };
  }, []);
}
