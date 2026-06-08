import { Layers } from "lucide-react";
import { TRNHintText } from "../../../../../ui/TRN";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { MESH_BUNDLE_NODE_TITLE, readMeshGroupInputCount } from "./mesh-group-inputs";

export type MeshGroupNodePanelProps = {
  defaultConfig: Record<string, unknown>;
};

/** Compact canvas body for **Mesh Bundle**. */
export function MeshGroupNodePanel(props: MeshGroupNodePanelProps) {
  const inputCount = readMeshGroupInputCount(props.defaultConfig);

  return (
    <ReadingPanel className="nodrag space-y-2 px-2 pb-2 pt-1">
      <div className="flex items-center gap-1 text-[9px] text-zinc-500">
        <Layers className="h-2.5 w-2.5 shrink-0" aria-hidden />
        <span>
          {MESH_BUNDLE_NODE_TITLE} · {inputCount} inputs
        </span>
      </div>
      <TRNHintText tone="muted" className="text-[9px] leading-snug">
        Wire mesh outputs into numbered inputs. Stage shows each mesh separately after commit.
      </TRNHintText>
    </ReadingPanel>
  );
}
