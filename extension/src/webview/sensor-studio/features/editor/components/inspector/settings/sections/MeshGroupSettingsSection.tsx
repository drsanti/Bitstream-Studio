import { Layers, Minus, Plus } from "lucide-react";
import { TRNButton, TRNHintText } from "../../../../../../../ui/TRN";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "../../inspector-node-tab-stack";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  MESH_GROUP_INPUT_COUNT_KEY,
  MESH_GROUP_MAX_INPUTS,
  MESH_GROUP_MIN_INPUTS,
  MESH_BUNDLE_NODE_TITLE,
  readMeshGroupInputCount,
} from "../../../../nodes/mesh/mesh-group-inputs";

export function MeshGroupSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const inputCount = readMeshGroupInputCount(dc);

  const setInputCount = (next: number) => {
    onUpdateConfigField(
      MESH_GROUP_INPUT_COUNT_KEY,
      Math.min(MESH_GROUP_MAX_INPUTS, Math.max(MESH_GROUP_MIN_INPUTS, next)),
    );
  };

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title={MESH_BUNDLE_NODE_TITLE}
        icon={<Layers className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Combine ordered **Mesh** wires into one output. Stage still shows each primitive separately when committed."
        defaultExpanded
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-zinc-300">Mesh inputs</span>
          <div className="flex items-center gap-1">
            <TRNButton
              type="button"
              size="compact"
              disabled={inputCount <= MESH_GROUP_MIN_INPUTS}
              hint="Remove one mesh input socket (disconnects wires on dropped sockets)."
              onClick={() => setInputCount(inputCount - 1)}
            >
              <Minus className="h-3 w-3" aria-hidden />
            </TRNButton>
            <span className="min-w-[1.5rem] text-center text-[11px] text-zinc-100">{inputCount}</span>
            <TRNButton
              type="button"
              size="compact"
              disabled={inputCount >= MESH_GROUP_MAX_INPUTS}
              hint="Add one mesh input socket."
              onClick={() => setInputCount(inputCount + 1)}
            >
              <Plus className="h-3 w-3" aria-hidden />
            </TRNButton>
          </div>
        </div>
        <TRNHintText tone="muted" className="text-[10px] leading-snug">
          Wire primitive **Mesh** outputs into inputs **1 … {inputCount}**. Order is preserved when
          flattening to Stage.
        </TRNHintText>
      </InspectorCollapsibleSection>
    </div>
  );
}
