import { FlowNodeHeaderBadge } from "../flow-node/FlowNodeHeaderBadge";
import {
  resolveCameraInputHeaderBadge,
  useCameraInputRuntimeUi,
} from "./camera-input-chrome";

export function CameraInputHeaderBadge(props: {
  nodeId: string;
  configEnabled: boolean;
}) {
  const runtime = useCameraInputRuntimeUi(props.nodeId);
  const badge = resolveCameraInputHeaderBadge(runtime, props.configEnabled);
  if (badge == null) {
    return null;
  }
  return (
    <FlowNodeHeaderBadge tone={badge.tone} pulseDot={badge.pulseDot}>
      {badge.label}
    </FlowNodeHeaderBadge>
  );
}
