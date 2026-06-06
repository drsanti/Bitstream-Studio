import { FlowNodeHeaderBadge } from "../flow-node/FlowNodeHeaderBadge";
import {
  resolveCss3dFeedHeaderBadge,
  useCss3dFeedVisibleUi,
} from "./css3d-camera-feed-chrome";

export function Css3dCameraFeedHeaderBadge(props: { nodeId: string }) {
  const visible = useCss3dFeedVisibleUi(props.nodeId);
  const badge = resolveCss3dFeedHeaderBadge(visible);
  return (
    <FlowNodeHeaderBadge tone={badge.tone} pulseDot={badge.pulseDot}>
      {badge.label}
    </FlowNodeHeaderBadge>
  );
}
