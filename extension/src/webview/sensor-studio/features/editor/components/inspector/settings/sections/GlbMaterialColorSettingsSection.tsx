import { TRNFormField, TRNSelect } from "../../../../../ui/TRN";
import {
  defaultGlbMaterialColorHex,
  materialColorTargetLabel,
  readGlbMaterialColorTarget,
  STUDIO_GLB_MATERIAL_COLOR_HEX_KEY,
  STUDIO_GLB_MATERIAL_COLOR_TARGET_KEY,
  STUDIO_GLB_MATERIAL_COLOR_TARGETS,
  type StudioGlbMaterialColorTargetV1,
} from "../../../../gltf/studio-glb-material-color";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { TRNColorRingPicker } from "../../../../../ui/TRN";

export function GlbMaterialColorSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { defaultConfig: dc, onUpdateConfigField } = props;
  const target = readGlbMaterialColorTarget(dc);
  const hex =
    typeof dc[STUDIO_GLB_MATERIAL_COLOR_HEX_KEY] === "string"
      ? (dc[STUDIO_GLB_MATERIAL_COLOR_HEX_KEY] as string).trim()
      : defaultGlbMaterialColorHex(target);

  return (
    <>
      <TRNFormField label="Color target" id="glb-material-color-target" className="space-y-1.5">
        <TRNSelect
          ariaLabel="GLB material color target"
          value={target}
          options={STUDIO_GLB_MATERIAL_COLOR_TARGETS.map((t) => ({
            value: t,
            label: materialColorTargetLabel(t),
          }))}
          triggerClassName="w-full"
          onValueChange={(next) => {
            onUpdateConfigField(STUDIO_GLB_MATERIAL_COLOR_TARGET_KEY, next as StudioGlbMaterialColorTargetV1);
          }}
        />
      </TRNFormField>
      <TRNFormField label="RGB color" id="glb-material-color-hex" className="space-y-1.5">
        <TRNColorRingPicker
          ariaLabel="Material RGB color"
          valueHex={hex}
          onValueHexChange={(nextHex) => {
            onUpdateConfigField(STUDIO_GLB_MATERIAL_COLOR_HEX_KEY, nextHex.trim());
          }}
        />
      </TRNFormField>
    </>
  );
}
