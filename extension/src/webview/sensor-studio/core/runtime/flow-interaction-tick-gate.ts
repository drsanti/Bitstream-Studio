import {
  isFlowCanvasPanActive,
  isFlowNodeDragActive,
} from "../../features/editor/nodes/flow-node/flow-node-drag-state";
import {
  type FlowInteractionThrottleFpsPreset,
  type FlowInteractionTickPolicy,
  type FlowInteractionTriggers,
  type SensorStudioMaxFpsPreset,
} from "../../persistence/sensor-studio-performance-preferences";
import { useSensorStudioPerformanceStore } from "../../state/sensor-studio-performance.store";

export type FlowInteractionActiveKind = "nodeDrag" | "canvasPan" | null;

export type FlowInteractionTickGate = {
  /** A configured trigger (drag/pan) is active and policy is not inherit-only noop. */
  editingActive: boolean;
  /** `tickSimulation` should return immediately without eval. */
  blocked: boolean;
  /** Active trigger for live stats copy (drag wins over pan). */
  activeKind: FlowInteractionActiveKind;
  policy: FlowInteractionTickPolicy;
  /** Cap passed to `shouldRunCappedFrame` (accounts for throttle + normal cap). */
  tickMaxFps: number;
};

export type ResolveFlowInteractionTickGateArgs = {
  nodeDragActive: boolean;
  canvasPanActive: boolean;
  policy: FlowInteractionTickPolicy;
  throttleFps: FlowInteractionThrottleFpsPreset;
  triggers: FlowInteractionTriggers;
  normalMaxFps: SensorStudioMaxFpsPreset;
};

function resolveActiveKind(
  nodeDragActive: boolean,
  canvasPanActive: boolean,
  triggers: FlowInteractionTriggers,
): FlowInteractionActiveKind {
  if (triggers.nodeDrag && nodeDragActive) {
    return "nodeDrag";
  }
  if (triggers.canvasPan && canvasPanActive) {
    return "canvasPan";
  }
  return null;
}

/** Minimum of normal flow cap and interaction throttle cap (`0` = unlimited). */
export function resolveInteractionThrottleTickMaxFps(
  normalMaxFps: SensorStudioMaxFpsPreset,
  throttleFps: FlowInteractionThrottleFpsPreset,
): number {
  if (normalMaxFps === 0) {
    return throttleFps;
  }
  return Math.min(normalMaxFps, throttleFps);
}

export function resolveFlowInteractionTickGate(
  args: ResolveFlowInteractionTickGateArgs,
): FlowInteractionTickGate {
  const activeKind = resolveActiveKind(
    args.nodeDragActive,
    args.canvasPanActive,
    args.triggers,
  );
  const tickMaxFps = args.normalMaxFps;

  if (activeKind == null) {
    return {
      editingActive: false,
      blocked: false,
      activeKind: null,
      policy: args.policy,
      tickMaxFps,
    };
  }

  switch (args.policy) {
    case "inherit":
      return {
        editingActive: true,
        blocked: false,
        activeKind,
        policy: args.policy,
        tickMaxFps,
      };
    case "pause":
      return {
        editingActive: true,
        blocked: true,
        activeKind,
        policy: args.policy,
        tickMaxFps,
      };
    case "throttle":
      return {
        editingActive: true,
        blocked: false,
        activeKind,
        policy: args.policy,
        tickMaxFps: resolveInteractionThrottleTickMaxFps(
          args.normalMaxFps,
          args.throttleFps,
        ),
      };
    default:
      return {
        editingActive: false,
        blocked: false,
        activeKind: null,
        policy: args.policy,
        tickMaxFps,
      };
  }
}

/** Reads drag/pan signals + session performance prefs. */
export function readFlowInteractionTickGate(): FlowInteractionTickGate {
  const prefs = useSensorStudioPerformanceStore.getState().preferences;
  return resolveFlowInteractionTickGate({
    nodeDragActive: isFlowNodeDragActive(),
    canvasPanActive: isFlowCanvasPanActive(),
    policy: prefs.flowInteractionTickPolicy,
    throttleFps: prefs.flowInteractionThrottleFps,
    triggers: prefs.flowInteractionTriggers,
    normalMaxFps: prefs.flowSimulationMaxFps,
  });
}

export function formatFlowInteractionActiveKindLabel(
  kind: FlowInteractionActiveKind,
): string {
  switch (kind) {
    case "nodeDrag":
      return "drag";
    case "canvasPan":
      return "pan";
    default:
      return "";
  }
}
