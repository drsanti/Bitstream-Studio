import { FlowNodeHeaderBadge } from "../flow-node/FlowNodeHeaderBadge";
import {
  resolveMaterialVideoHeaderBadge,
  useMaterialVideoActiveUi,
} from "./material-video-chrome";

export function MaterialVideoHeaderBadge(props: { nodeId: string }) {
  const active = useMaterialVideoActiveUi(props.nodeId);
  const badge = resolveMaterialVideoHeaderBadge(active);
  return (
    <FlowNodeHeaderBadge tone={badge.tone} pulseDot={badge.pulseDot}>
      {badge.label}
    </FlowNodeHeaderBadge>
  );
}
