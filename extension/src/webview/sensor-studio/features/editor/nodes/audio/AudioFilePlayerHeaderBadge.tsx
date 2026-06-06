import { useMemo } from "react";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { FlowNodeHeaderBadge } from "../flow-node/FlowNodeHeaderBadge";
import {
  resolveFilePlayerGate,
  resolveFilePlayerHeaderBadge,
  useFilePlayerRuntimeUi,
  useFilePlayerTransportUi,
} from "./audio-file-player-chrome";

export type AudioFilePlayerHeaderBadgeProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function AudioFilePlayerHeaderBadge(props: AudioFilePlayerHeaderBadgeProps) {
  const { nodeId, defaultConfig } = props;
  const configEnabled = defaultConfig.enabled === true;
  const runtime = useFilePlayerRuntimeUi(nodeId);
  const transport = useFilePlayerTransportUi(nodeId);
  const edges = useFlowEditorStore((s) => s.edges);
  const nodeData = useFlowEditorStore((s) => {
    const n = s.nodes.find((x) => x.id === nodeId);
    return n?.type === "studio" ? n.data : null;
  });

  const isGateWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "gate"),
    [edges, nodeId],
  );

  const gate = resolveFilePlayerGate(
    defaultConfig,
    nodeData?.liveInputBooleanByHandle?.gate,
    isGateWired,
  );
  const view = resolveFilePlayerHeaderBadge(
    runtime,
    configEnabled,
    gate,
    transport.playing,
  );

  if (view == null) {
    return null;
  }

  return (
    <FlowNodeHeaderBadge tone={view.tone} pulseDot={view.pulseDot}>
      {view.label}
    </FlowNodeHeaderBadge>
  );
}
