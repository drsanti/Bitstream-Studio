import type { ReactElement } from "react";
import { TRNHintText, TRNTransformSection, type TRNTransformSectionValue } from "../../../../../../../ui/TRN";
import {
  glbPartTransformFieldsForNodeConfigPatch,
  readGlbPartTransformFromConfig,
  readGlbPartTransformPath,
} from "../../../../nodes/scene/glb-part-transform-config";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-registry";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";

export function GlbPartTransformSettingsSection(
  props: NodeInspectorSettingsSectionProps,
): ReactElement {
  const { selectedNode } = props;
  const patchFields = useFlowEditorStore((s) => s.patchNodeConfigFieldsByNodeId);
  const transform = readGlbPartTransformFromConfig(selectedNode.data.defaultConfig);
  const partPath = readGlbPartTransformPath(selectedNode.data.defaultConfig);

  const uniformScale =
    Math.abs(transform.scale.x - transform.scale.y) < 1e-6 &&
    Math.abs(transform.scale.x - transform.scale.z) < 1e-6;

  const onChange = (next: TRNTransformSectionValue) => {
    patchFields(
      selectedNode.id,
      glbPartTransformFieldsForNodeConfigPatch({
        version: 1,
        position: next.position,
        rotationDeg: next.rotationDeg ?? transform.rotationDeg,
        scale: next.scale,
      }),
    );
  };

  return (
    <div className="space-y-2">
      {partPath.length > 0 ? (
        <TRNHintText tone="muted" className="text-[10px] leading-snug">
          GLB part: <span className="text-zinc-300">{partPath}</span>
        </TRNHintText>
      ) : null}
      <TRNTransformSection
        value={{
          position: transform.position,
          rotationDeg: transform.rotationDeg,
          scale: transform.scale,
          uniformScale,
        }}
        onChange={onChange}
        scrubInteraction={{ pointerScrubEnabled: true }}
      />
    </div>
  );
}
