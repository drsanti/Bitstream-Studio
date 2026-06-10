import { Globe2 } from "lucide-react";
import { TRNColorRingPicker } from "../../ui/TRN/TRNColorRingPicker";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import { TRNInlineToggleRow } from "../../ui/TRN/TRNInlineToggleRow";
import { clampEngineCubemapPresetIndex } from "@/engine-environment/t3dEngineEnvironment";
import {
  resolveSceneEnvironmentSettings,
  type SceneEnvironmentSettingsV1,
  type SceneV1,
} from "../schemas/scene.v1";
import { buildCourseSceneCubemapSelectOptions } from "../runtime/scene/sceneCubemapSelectOptions";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { useCourseSceneEditorStore } from "./useCourseSceneEditorStore";

export function CourseSceneEnvironmentFields({
  documentId,
  scene,
}: {
  documentId: string;
  scene: SceneV1;
}) {
  const patchSettings = useCourseSceneEditorStore((s) => s.patchSettings);
  const env = resolveSceneEnvironmentSettings(scene.settings);
  const cubemapOptions = buildCourseSceneCubemapSelectOptions();

  const patch = (next: Partial<SceneEnvironmentSettingsV1>) => {
    patchSettings(documentId, next);
  };

  return (
    <CourseInspectorCard
      title="Environment"
      hint="Background, cubemap lighting, grid, and contact shadows for this 3D Scene Block."
      titleIcon={<Globe2 className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded={false}
    >
      <div className="flex flex-col gap-3">
        <TRNFormField id={`${documentId}-env-cubemap`} label="Cubemap preset">
          <TRNSelect
            value={String(clampEngineCubemapPresetIndex(env.environmentPresetIndex))}
            ariaLabel="Environment cubemap preset"
            options={cubemapOptions}
            onValueChange={(value) => {
              const index = Number.parseInt(value, 10);
              if (Number.isFinite(index)) {
                patch({ environmentPresetIndex: clampEngineCubemapPresetIndex(index) });
              }
            }}
          />
        </TRNFormField>

        <TRNFormField id={`${documentId}-env-bg-color`} label="Solid background">
          <div className="flex min-w-0 items-center gap-2">
            <TRNColorRingPicker
              ariaLabel="Scene solid background color"
              valueHex={env.backgroundColor}
              enableAlpha={false}
              triggerVariant="swatch"
              size="sm"
              onValueHexChange={(hex) => patch({ backgroundColor: hex })}
            />
            <span className="truncate text-[10px] text-zinc-500">{env.backgroundColor}</span>
          </div>
        </TRNFormField>

        <div className="flex flex-col gap-2">
          <TRNInlineToggleRow
            label="Show cubemap backdrop"
            hint="Render the selected cubemap as the scene background."
            checked={env.showBackground}
            onCheckedChange={(checked) => patch({ showBackground: checked })}
            ariaLabel="Show cubemap as scene backdrop"
          />
          <TRNInlineToggleRow
            label="Image-based lighting"
            hint="Light metallic materials from the cubemap preset."
            checked={env.useIbl}
            onCheckedChange={(checked) => patch({ useIbl: checked })}
            ariaLabel="Use cubemap image-based lighting"
          />
          <TRNInlineToggleRow
            label="Ground grid"
            checked={env.showGrid}
            onCheckedChange={(checked) => patch({ showGrid: checked })}
            ariaLabel="Show ground grid"
          />
          <TRNInlineToggleRow
            label="Contact shadows"
            checked={env.contactShadows}
            onCheckedChange={(checked) => patch({ contactShadows: checked })}
            ariaLabel="Show contact shadows"
          />
        </div>

        <TRNHintText className="!text-[10px]">
          Turn off cubemap backdrop to use the solid color. IBL stays on the same cubemap preset for
          metallic PCB materials.
        </TRNHintText>
      </div>
    </CourseInspectorCard>
  );
}
