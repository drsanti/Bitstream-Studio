import { Move3d, Palette } from "lucide-react";
import { CourseMaintainerScrubNumberInput } from "./CourseMaintainerScrubNumberInput";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import { TRNToggleSwitch } from "../../ui/TRN/TRNToggleSwitch";
import { TRNColorRingPicker } from "../../ui/TRN/TRNColorRingPicker";
import {
  COURSE_DIAGRAM_3D_GIZMO_SIZE_MAX,
  COURSE_DIAGRAM_3D_GIZMO_SIZE_MIN,
} from "./course-diagram-3d-viewport.persistence";
import {
  buildScene3dSelectionPresetSelectOptions,
  SCENE_3D_SELECTION_LINE_WIDTH_MAX,
  SCENE_3D_SELECTION_LINE_WIDTH_MIN,
  SCENE_3D_SELECTION_OPACITY_MAX,
  SCENE_3D_SELECTION_OPACITY_MIN,
  type Scene3dSelectionAppearancePresetId,
  type Scene3dSelectionHighlightStyle,
} from "../runtime/diagram/diagram3dSelectionAppearance";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { useCourseDiagram3dViewportPrefs } from "./useCourseDiagram3dViewportPrefs";

const STYLE_OPTIONS: { value: Scene3dSelectionHighlightStyle; label: string }[] = [
  { value: "box", label: "Bounding box" },
  { value: "silhouette", label: "Silhouette outline" },
  { value: "both", label: "Box + silhouette" },
];

const PRESET_SELECT_OPTIONS = buildScene3dSelectionPresetSelectOptions();

function SelectionRoleFields({
  idPrefix,
  roleLabel,
  color,
  opacity,
  lineWidth,
  onColor,
  onOpacity,
  onLineWidth,
}: {
  idPrefix: string;
  roleLabel: string;
  color: string;
  opacity: number;
  lineWidth: number;
  onColor: (hex: string) => void;
  onOpacity: (value: number) => void;
  onLineWidth: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-800/80 bg-zinc-950/30 p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{roleLabel}</p>
      <TRNFormField id={`${idPrefix}-color`} label="Color">
        <TRNColorRingPicker
          valueHex={color}
          onValueHexChange={onColor}
          ariaLabel={`${roleLabel} highlight color`}
        />
      </TRNFormField>
      <TRNFormField id={`${idPrefix}-opacity`} label="Opacity">
        <CourseMaintainerScrubNumberInput
          value={opacity}
          step={0.05}
          min={SCENE_3D_SELECTION_OPACITY_MIN}
          max={SCENE_3D_SELECTION_OPACITY_MAX}
          onChange={onOpacity}
        />
      </TRNFormField>
      <TRNFormField id={`${idPrefix}-width`} label="Line weight">
        <CourseMaintainerScrubNumberInput
          value={lineWidth}
          step={1}
          min={SCENE_3D_SELECTION_LINE_WIDTH_MIN}
          max={SCENE_3D_SELECTION_LINE_WIDTH_MAX}
          onChange={onLineWidth}
        />
      </TRNFormField>
    </div>
  );
}

export function Diagram3dViewportFields({ idPrefix = "diagram3d-viewport" }: { idPrefix?: string }) {
  const gizmoSize = useCourseDiagram3dViewportPrefs((s) => s.gizmoSize);
  const setGizmoSize = useCourseDiagram3dViewportPrefs((s) => s.setGizmoSize);
  const selectionAppearance = useCourseDiagram3dViewportPrefs((s) => s.selectionAppearance);
  const patchSelectionAppearance = useCourseDiagram3dViewportPrefs((s) => s.patchSelectionAppearance);
  const applySelectionPreset = useCourseDiagram3dViewportPrefs((s) => s.applySelectionPreset);

  return (
    <>
      <CourseInspectorCard
        title="Viewport"
        hint="Editor-only preferences — not saved in scene or diagram JSON."
        titleIcon={<Move3d className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultExpanded={false}
      >
        <div className="flex flex-col gap-2">
          <TRNFormField id={`${idPrefix}-gizmo-size`} label="Gizmo size">
            <CourseMaintainerScrubNumberInput
              value={gizmoSize}
              step={0.1}
              min={COURSE_DIAGRAM_3D_GIZMO_SIZE_MIN}
              max={COURSE_DIAGRAM_3D_GIZMO_SIZE_MAX}
              onChange={setGizmoSize}
            />
          </TRNFormField>
          <TRNHintText className="!text-[10px]">
            Move · Rotate · Scale (G / R / S). 5 toggles perspective / orthographic. View snaps: 1
            front · 3 right · 7 top · 9 back (numpad or number row). Shift+A opens the Add object
            menu.
          </TRNHintText>
        </div>
      </CourseInspectorCard>

      <CourseInspectorCard
        title="Selection highlights"
        hint="Viewport + outliner colors for selected vs active objects (Blender-style)."
        titleIcon={<Palette className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultExpanded={false}
      >
        <div className="flex flex-col gap-2">
          <TRNFormField id={`${idPrefix}-selection-enabled`} label="Show highlights">
            <TRNToggleSwitch
              checked={selectionAppearance.enabled}
              onCheckedChange={(enabled) => patchSelectionAppearance({ enabled })}
              ariaLabel="Enable selection highlights"
            />
          </TRNFormField>

          <TRNFormField id={`${idPrefix}-selection-preset`} label="Preset">
            <TRNSelect
              value={selectionAppearance.presetId}
              options={PRESET_SELECT_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
                disabled: option.disabled,
              }))}
              ariaLabel="Selection highlight preset"
              onValueChange={(value) => {
                if (value === "custom") {
                  return;
                }
                applySelectionPreset(
                  value as Exclude<Scene3dSelectionAppearancePresetId, "custom">,
                );
              }}
            />
          </TRNFormField>

          <TRNFormField id={`${idPrefix}-selection-style`} label="Highlight style">
            <TRNSelect
              value={selectionAppearance.style}
              options={STYLE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              ariaLabel="Selection highlight style"
              onValueChange={(value) =>
                patchSelectionAppearance({ style: value as Scene3dSelectionHighlightStyle })
              }
            />
          </TRNFormField>

          <SelectionRoleFields
            idPrefix={`${idPrefix}-selected`}
            roleLabel="Selected"
            color={selectionAppearance.selected.color}
            opacity={selectionAppearance.selected.opacity}
            lineWidth={selectionAppearance.selected.lineWidth}
            onColor={(color) => patchSelectionAppearance({ selected: { color } })}
            onOpacity={(opacity) => patchSelectionAppearance({ selected: { opacity } })}
            onLineWidth={(lineWidth) => patchSelectionAppearance({ selected: { lineWidth } })}
          />

          <SelectionRoleFields
            idPrefix={`${idPrefix}-active`}
            roleLabel="Active (gizmo target)"
            color={selectionAppearance.active.color}
            opacity={selectionAppearance.active.opacity}
            lineWidth={selectionAppearance.active.lineWidth}
            onColor={(color) => patchSelectionAppearance({ active: { color } })}
            onOpacity={(opacity) => patchSelectionAppearance({ active: { opacity } })}
            onLineWidth={(lineWidth) => patchSelectionAppearance({ active: { lineWidth } })}
          />

          <TRNFormField id={`${idPrefix}-sync-outliner`} label="Sync outliner colors">
            <TRNToggleSwitch
              checked={selectionAppearance.syncOutlinerColors}
              onCheckedChange={(syncOutlinerColors) =>
                patchSelectionAppearance({ syncOutlinerColors })
              }
              ariaLabel="Sync outliner selection colors"
            />
          </TRNFormField>

          <TRNFormField id={`${idPrefix}-group-outlines`} label="Show group outlines">
            <TRNToggleSwitch
              checked={selectionAppearance.showGroupOutlines}
              onCheckedChange={(showGroupOutlines) =>
                patchSelectionAppearance({ showGroupOutlines })
              }
              ariaLabel="Show group selection outlines"
            />
          </TRNFormField>

          <TRNFormField id={`${idPrefix}-procedural-tint`} label="Procedural emissive tint">
            <TRNToggleSwitch
              checked={selectionAppearance.proceduralEmissiveTint}
              onCheckedChange={(proceduralEmissiveTint) =>
                patchSelectionAppearance({ proceduralEmissiveTint })
              }
              ariaLabel="Tint procedural meshes when selected"
            />
          </TRNFormField>
        </div>
      </CourseInspectorCard>
    </>
  );
}
