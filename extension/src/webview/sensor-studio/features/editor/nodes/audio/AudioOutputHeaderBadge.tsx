import { FlowNodeHeaderBadge } from "../flow-node/FlowNodeHeaderBadge";
import {
  resolveAudioOutputHeaderBadge,
  useAudioOutputRuntimeUi,
} from "./audio-output-chrome";

export type AudioOutputHeaderBadgeProps = {
  defaultConfig: Record<string, unknown>;
};

export function AudioOutputHeaderBadge(props: AudioOutputHeaderBadgeProps) {
  const { defaultConfig } = props;
  const configEnabled = defaultConfig.enabled === true;
  const runtime = useAudioOutputRuntimeUi();
  const view = resolveAudioOutputHeaderBadge(runtime, configEnabled);

  if (view == null) {
    return null;
  }

  return (
    <FlowNodeHeaderBadge tone={view.tone} pulseDot={view.pulseDot}>
      {view.label}
    </FlowNodeHeaderBadge>
  );
}
