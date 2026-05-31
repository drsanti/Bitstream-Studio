import { TRNHintText, TRNSelect } from "../../../../../../../ui/TRN";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  materialTextureSlotLabel,
  readGlbMaterialTextureSlot,
  STUDIO_GLB_MATERIAL_TEXTURE_SLOT_KEY,
  STUDIO_GLB_MATERIAL_TEXTURE_SLOTS,
  type StudioGlbMaterialTextureSlotV1,
} from "../../../../gltf/studio-glb-material-texture";
import { readGlbExtractTag } from "../../../../model/model-generated-bindings";

export function GlbMaterialTextureSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const glbTag = readGlbExtractTag(dc);
  const slot = readGlbMaterialTextureSlot(dc);

  return (
    <div className="space-y-2">
      {glbTag != null && glbTag.kind === "material" ? (
        <InspectorPropertyRow
          label="Map slot"
          description="Which material map this texture replaces in linked Model Viewer / 3D Rotation previews."
        >
          <TRNSelect
            value={slot}
            options={STUDIO_GLB_MATERIAL_TEXTURE_SLOTS.map((s) => ({
              value: s,
              label: materialTextureSlotLabel(s),
            }))}
            ariaLabel="GLB material texture map slot"
            size="sm"
            onValueChange={(next) =>
              onUpdateConfigField(
                STUDIO_GLB_MATERIAL_TEXTURE_SLOT_KEY,
                next as StudioGlbMaterialTextureSlotV1,
              )
            }
          />
        </InspectorPropertyRow>
      ) : null}
      <TRNHintText tone="muted" className="text-[11px] leading-snug">
        Pick a **2D texture** on the node card (Asset Browser textures). Default slot is **Base color
        (map)**. Spawn from Library **GLB → Materials → Tex** with a **Studio Model** selected.
      </TRNHintText>
    </div>
  );
}
