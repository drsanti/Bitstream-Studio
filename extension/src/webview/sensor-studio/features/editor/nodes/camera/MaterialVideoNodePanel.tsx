import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { ReadingLabel } from "../flow-node/readings/ReadingLabel";
import { readGlbExtractTag } from "../../model/model-generated-bindings";
import { materialTextureSlotLabel, readGlbMaterialTextureSlot } from "../../gltf/studio-glb-material-texture";
import { useMaterialVideoActiveUi } from "./material-video-chrome";

export function MaterialVideoNodePanel(props: {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
}) {
  const { defaultConfig } = props;
  const active = useMaterialVideoActiveUi(props.nodeId);
  const tag = readGlbExtractTag(defaultConfig);
  const slot = readGlbMaterialTextureSlot(defaultConfig);
  const materialLabel =
    tag?.kind === "material" ? tag.ref : "Bind a material from Library";

  return (
    <ReadingPanel className="space-y-1">
      <ReadingLabel className="mb-0.5 block">Material video</ReadingLabel>
      <div className="text-[11px] text-zinc-300">{materialLabel}</div>
      <div className="text-[10px] text-zinc-500">{materialTextureSlotLabel(slot)}</div>
      <div className="text-[10px] text-zinc-400">
        {active ? "Live texture applied when wired." : "Wire Camera Input → Video Texture → Texture."}
      </div>
    </ReadingPanel>
  );
}
