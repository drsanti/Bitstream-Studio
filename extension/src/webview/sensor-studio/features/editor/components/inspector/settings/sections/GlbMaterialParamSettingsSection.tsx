import { TRNSelect } from "../../../../../../../ui/TRN";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { NumberConstantSettingsSection } from "./NumberConstantSettingsSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  materialParamLabel,
  readGlbMaterialParam,
  STUDIO_GLB_MATERIAL_PARAM_KEY,
  STUDIO_GLB_MATERIAL_PARAMS,
  type StudioGlbMaterialParamV1,
} from "../../../../gltf/studio-glb-material-param";
import { readGlbExtractTag } from "../../../../model/model-generated-bindings";

export function GlbMaterialParamSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const glbTag = readGlbExtractTag(dc);
  const param = readGlbMaterialParam(dc);

  return (
    <div className="space-y-2">
      {glbTag != null && glbTag.kind === "material" ? (
        <InspectorPropertyRow
          label="PBR channel"
          description="Which material property this node drives in linked Model Viewer / 3D Rotation previews."
        >
          <TRNSelect
            value={param}
            options={STUDIO_GLB_MATERIAL_PARAMS.map((p) => ({
              value: p,
              label: materialParamLabel(p),
            }))}
            ariaLabel="GLB material PBR channel"
            size="sm"
            onValueChange={(next) =>
              onUpdateConfigField(STUDIO_GLB_MATERIAL_PARAM_KEY, next as StudioGlbMaterialParamV1)
            }
          />
        </InspectorPropertyRow>
      ) : null}
      <NumberConstantSettingsSection {...props} />
    </div>
  );
}
