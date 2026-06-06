import { useMemo } from "react";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { FlowNodeHeaderBadge } from "../flow-node/FlowNodeHeaderBadge";
import {
  resolveOscillatorGate,
  resolveOscillatorHeaderBadge,
} from "./audio-oscillator-chrome";

export type AudioOscillatorHeaderBadgeProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function AudioOscillatorHeaderBadge(props: AudioOscillatorHeaderBadgeProps) {
  const { nodeId, defaultConfig } = props;
  const edges = useFlowEditorStore((s) => s.edges);
  const nodeData = useFlowEditorStore((s) => {
    const n = s.nodes.find((x) => x.id === nodeId);
    return n?.type === "studio" ? n.data : null;
  });

  const isGateWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "gate"),
    [edges, nodeId],
  );

  const gate = resolveOscillatorGate(
    defaultConfig,
    nodeData?.liveInputBooleanByHandle?.gate,
    isGateWired,
  );
  const view = resolveOscillatorHeaderBadge(gate);

  if (view == null) {
    return null;
  }

  return (
    <FlowNodeHeaderBadge tone={view.tone} pulseDot={view.pulseDot}>
      {view.label}
    </FlowNodeHeaderBadge>
  );
}
