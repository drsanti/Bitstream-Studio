import { TRNColorRingPicker, TRNFormField } from "../../../../../../../ui/TRN";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  defaultMeshMaterialColorHex,
  MESH_MATERIAL_COLOR_HEX_KEY,
  MESH_MATERIAL_CLEARCOAT_KEY,
  MESH_MATERIAL_CLEARCOAT_ROUGHNESS_KEY,
  MESH_MATERIAL_METALNESS_KEY,
  MESH_MATERIAL_OPACITY_KEY,
  MESH_MATERIAL_ROUGHNESS_KEY,
  MESH_MATERIAL_TRANSMISSION_KEY,
  MESH_MATERIAL_WIREFRAME_KEY,
  meshMaterialKindForNodeId,
  meshMaterialKindLabel,
} from "../../../../nodes/material/mesh-material-config";

export function MeshMaterialSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig;
  const kind = meshMaterialKindForNodeId(selectedNode.data.nodeId);
  const hex =
    typeof dc[MESH_MATERIAL_COLOR_HEX_KEY] === "string"
      ? (dc[MESH_MATERIAL_COLOR_HEX_KEY] as string).trim()
      : defaultMeshMaterialColorHex();

  if (kind == null) {
    return null;
  }

  return (
    <div className="space-y-2">
      <TRNFormField
        label="Material type"
        id="mesh-material-kind"
        className="space-y-1.5"
        hint="Three.js material family emitted on the Material output wire."
      >
        <div className="rounded-md border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-1.5 text-[11px] text-zinc-300">
          {meshMaterialKindLabel(kind)}
        </div>
      </TRNFormField>
      <TRNFormField label="Color" id="mesh-material-color" className="space-y-1.5">
        <TRNColorRingPicker
          ariaLabel="Mesh material color"
          valueHex={hex}
          onValueHexChange={(nextHex) => {
            onUpdateConfigField(MESH_MATERIAL_COLOR_HEX_KEY, nextHex.trim());
          }}
        />
      </TRNFormField>
      <InspectorNumericScrubRow
        label="Opacity"
        description="Wired Opacity input overrides this value each tick."
        ariaLabel="Mesh material opacity"
        value={typeof dc[MESH_MATERIAL_OPACITY_KEY] === "number" ? dc[MESH_MATERIAL_OPACITY_KEY] : 1}
        min={0}
        max={1}
        step={0.01}
        onCommit={(next) => onUpdateConfigField(MESH_MATERIAL_OPACITY_KEY, next)}
      />
      {kind === "standard" || kind === "physical" ? (
        <>
          <InspectorNumericScrubRow
            label="Roughness"
            description="Wired Roughness input overrides this value."
            ariaLabel="Mesh material roughness"
            value={
              typeof dc[MESH_MATERIAL_ROUGHNESS_KEY] === "number"
                ? dc[MESH_MATERIAL_ROUGHNESS_KEY]
                : 0.5
            }
            min={0}
            max={1}
            step={0.01}
            onCommit={(next) => onUpdateConfigField(MESH_MATERIAL_ROUGHNESS_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Metalness"
            description="Wired Metalness input overrides this value."
            ariaLabel="Mesh material metalness"
            value={
              typeof dc[MESH_MATERIAL_METALNESS_KEY] === "number"
                ? dc[MESH_MATERIAL_METALNESS_KEY]
                : 0
            }
            min={0}
            max={1}
            step={0.01}
            onCommit={(next) => onUpdateConfigField(MESH_MATERIAL_METALNESS_KEY, next)}
          />
          {kind === "physical" ? (
            <>
              <InspectorNumericScrubRow
                label="Clearcoat"
                ariaLabel="Mesh material clearcoat"
                value={
                  typeof dc[MESH_MATERIAL_CLEARCOAT_KEY] === "number"
                    ? dc[MESH_MATERIAL_CLEARCOAT_KEY]
                    : 0
                }
                min={0}
                max={1}
                step={0.01}
                onCommit={(next) => onUpdateConfigField(MESH_MATERIAL_CLEARCOAT_KEY, next)}
              />
              <InspectorNumericScrubRow
                label="Clearcoat roughness"
                ariaLabel="Mesh material clearcoat roughness"
                value={
                  typeof dc[MESH_MATERIAL_CLEARCOAT_ROUGHNESS_KEY] === "number"
                    ? dc[MESH_MATERIAL_CLEARCOAT_ROUGHNESS_KEY]
                    : 0
                }
                min={0}
                max={1}
                step={0.01}
                onCommit={(next) =>
                  onUpdateConfigField(MESH_MATERIAL_CLEARCOAT_ROUGHNESS_KEY, next)
                }
              />
              <InspectorNumericScrubRow
                label="Transmission"
                ariaLabel="Mesh material transmission"
                value={
                  typeof dc[MESH_MATERIAL_TRANSMISSION_KEY] === "number"
                    ? dc[MESH_MATERIAL_TRANSMISSION_KEY]
                    : 0
                }
                min={0}
                max={1}
                step={0.01}
                onCommit={(next) => onUpdateConfigField(MESH_MATERIAL_TRANSMISSION_KEY, next)}
              />
            </>
          ) : null}
        </>
      ) : kind === "normal" ? null : (
        <InspectorPropertyRow
          label="Wireframe"
          description="Render as wireframe when this material is applied to a mesh."
        >
          <InspectorCompactToggleRow
            label="Wireframe"
            hint="Render as wireframe when this material is applied to a mesh."
            checked={dc[MESH_MATERIAL_WIREFRAME_KEY] === true}
            onCheckedChange={(next) => onUpdateConfigField(MESH_MATERIAL_WIREFRAME_KEY, next)}
            ariaLabel="Mesh material wireframe"
          />
        </InspectorPropertyRow>
      )}
    </div>
  );
}
