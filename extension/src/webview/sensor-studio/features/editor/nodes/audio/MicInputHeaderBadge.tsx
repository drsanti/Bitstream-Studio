import { FlowNodeHeaderBadge } from "../flow-node/FlowNodeHeaderBadge";
import {
  resolveMicInputHeaderBadge,
  useMicInputRuntimeUi,
} from "./mic-input-chrome";

export type MicInputHeaderBadgeProps = {
  nodeId: string;
  configEnabled: boolean;
};

export function MicInputHeaderBadge(props: MicInputHeaderBadgeProps) {
  const { nodeId, configEnabled } = props;
  const runtime = useMicInputRuntimeUi(nodeId);
  const view = resolveMicInputHeaderBadge(runtime, configEnabled);

  if (view == null) {
    return null;
  }

  return (
    <FlowNodeHeaderBadge tone={view.tone} pulseDot={view.pulseDot}>
      {view.label}
    </FlowNodeHeaderBadge>
  );
}
