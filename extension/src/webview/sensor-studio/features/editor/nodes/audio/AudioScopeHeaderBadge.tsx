import { useMemo } from "react";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { FlowNodeHeaderBadge } from "../flow-node/FlowNodeHeaderBadge";
import {
  resolveAudioScopeEnabled,
  resolveAudioScopeHeaderBadge,
} from "./audio-scope-chrome";

export type AudioScopeHeaderBadgeProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function AudioScopeHeaderBadge(props: AudioScopeHeaderBadgeProps) {
  const { nodeId, defaultConfig } = props;
  const mode = typeof defaultConfig.mode === "string" ? defaultConfig.mode : "waveform";
  const edges = useFlowEditorStore((s) => s.edges);
  const nodeData = useFlowEditorStore((s) => {
    const n = s.nodes.find((x) => x.id === nodeId);
    return n?.type === "studio" ? n.data : null;
  });

  const isEnabledWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "enabled"),
    [edges, nodeId],
  );

  const enabled = resolveAudioScopeEnabled(
    defaultConfig,
    nodeData?.liveInputBooleanByHandle?.enabled,
    isEnabledWired,
  );
  const view = resolveAudioScopeHeaderBadge(enabled, mode);

  if (view == null) {
    return null;
  }

  return (
    <FlowNodeHeaderBadge tone={view.tone} pulseDot={view.pulseDot}>
      {view.label}
    </FlowNodeHeaderBadge>
  );
}
