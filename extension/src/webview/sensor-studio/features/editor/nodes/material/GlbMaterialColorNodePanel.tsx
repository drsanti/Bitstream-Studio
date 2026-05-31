import { useCallback } from "react";
import { TRNColorRingPicker, TRNSelect } from "../../../../../ui/TRN";
import {
  defaultGlbMaterialColorHex,
  materialColorTargetLabel,
  readGlbMaterialColorTarget,
  STUDIO_GLB_MATERIAL_COLOR_HEX_KEY,
  STUDIO_GLB_MATERIAL_COLOR_TARGET_KEY,
  STUDIO_GLB_MATERIAL_COLOR_TARGETS,
  type StudioGlbMaterialColorTargetV1,
} from "../../gltf/studio-glb-material-color";
import { useFlowEditorStore } from "../../store/flow-editor.store";

export type GlbMaterialColorNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function GlbMaterialColorNodePanel(props: GlbMaterialColorNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const target = readGlbMaterialColorTarget(defaultConfig);
  const hex =
    typeof defaultConfig[STUDIO_GLB_MATERIAL_COLOR_HEX_KEY] === "string"
      ? (defaultConfig[STUDIO_GLB_MATERIAL_COLOR_HEX_KEY] as string).trim()
      : defaultGlbMaterialColorHex(target);

  const applyTarget = useCallback(
    (next: StudioGlbMaterialColorTargetV1) => {
      updateField(nodeId, STUDIO_GLB_MATERIAL_COLOR_TARGET_KEY, next);
      if (
        typeof defaultConfig[STUDIO_GLB_MATERIAL_COLOR_HEX_KEY] !== "string" ||
        (defaultConfig[STUDIO_GLB_MATERIAL_COLOR_HEX_KEY] as string).trim().length === 0
      ) {
        updateField(nodeId, STUDIO_GLB_MATERIAL_COLOR_HEX_KEY, defaultGlbMaterialColorHex(next));
      }
    },
    [defaultConfig, nodeId, updateField],
  );

  return (
    <div className="space-y-2 py-0.5">
      <TRNSelect
        ariaLabel="GLB material color target"
        value={target}
        options={STUDIO_GLB_MATERIAL_COLOR_TARGETS.map((t) => ({
          value: t,
          label: materialColorTargetLabel(t),
        }))}
        triggerClassName="w-full"
        onValueChange={(next) => {
          applyTarget(next as StudioGlbMaterialColorTargetV1);
        }}
      />
      <TRNColorRingPicker
        ariaLabel="Material color"
        valueHex={hex}
        onValueHexChange={(nextHex) => {
          updateField(nodeId, STUDIO_GLB_MATERIAL_COLOR_HEX_KEY, nextHex.trim());
        }}
      />
    </div>
  );
}
