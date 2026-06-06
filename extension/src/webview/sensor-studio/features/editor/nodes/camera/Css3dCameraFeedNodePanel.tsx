import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { ReadingLabel } from "../flow-node/readings/ReadingLabel";
import { useCss3dFeedVisibleUi } from "./css3d-camera-feed-chrome";

export function Css3dCameraFeedNodePanel(props: {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
}) {
  const cfg = props.defaultConfig;
  const anchorMode = cfg.anchorMode === "world" ? "World" : "Screen";
  const visible = useCss3dFeedVisibleUi(props.nodeId);

  return (
    <ReadingPanel className="space-y-1">
      <ReadingLabel className="mb-0.5 block">CSS3D feed</ReadingLabel>
      <div className="text-[11px] text-zinc-300">
        {anchorMode} overlay · {visible ? "Visible" : "Hidden"}
      </div>
      <div className="text-[10px] text-zinc-500">Wire Camera Input → In</div>
    </ReadingPanel>
  );
}
