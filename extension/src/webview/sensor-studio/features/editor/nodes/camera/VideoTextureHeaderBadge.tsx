import { FlowNodeHeaderBadge } from "../flow-node/FlowNodeHeaderBadge";
import {
  resolveVideoTextureHeaderBadge,
  useVideoTextureReadyUi,
} from "./video-texture-chrome";

export function VideoTextureHeaderBadge(props: { nodeId: string }) {
  const ready = useVideoTextureReadyUi(props.nodeId);
  const badge = resolveVideoTextureHeaderBadge(ready);
  return (
    <FlowNodeHeaderBadge tone={badge.tone} pulseDot={badge.pulseDot}>
      {badge.label}
    </FlowNodeHeaderBadge>
  );
}
