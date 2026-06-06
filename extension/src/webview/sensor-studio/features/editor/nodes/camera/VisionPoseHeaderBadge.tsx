import { FlowNodeHeaderBadge } from "../flow-node/FlowNodeHeaderBadge";
import {
  resolveVisionPoseHeaderBadge,
  useVisionPoseUi,
} from "./vision-pose-chrome";

export function VisionPoseHeaderBadge(props: { nodeId: string }) {
  const ui = useVisionPoseUi(props.nodeId);
  const badge = resolveVisionPoseHeaderBadge(ui);
  if (badge == null) {
    return null;
  }
  return (
    <FlowNodeHeaderBadge tone={badge.tone} pulseDot={badge.pulseDot}>
      {badge.label}
    </FlowNodeHeaderBadge>
  );
}
