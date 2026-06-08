import { TRNFormField } from "../../../../../ui/TRN";
import { TRNHintText } from "../../../../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../../../../ui/TRN/TRNSelect";
import type { StudioViewportMousePreset } from "../../../../core/viewport/studio-viewport-mouse-preset";
import type { StudioViewportViewSnapMode } from "../../../../core/viewport/studio-viewport-view-snaps";
import { InspectorSettingsSectionFrame } from "./InspectorSettingsSectionFrame";

const MOUSE_PRESET_OPTIONS = [
  { value: "three", label: "Three.js default" },
  { value: "blender", label: "Blender (MMB orbit)" },
] as const;

const VIEW_SNAP_OPTIONS = [
  { value: "camera-relative", label: "Camera-relative" },
  { value: "world-locked", label: "World-locked" },
] as const;

export type StageInspectorNavigationCardProps = {
  mousePreset: StudioViewportMousePreset;
  viewSnapMode: StudioViewportViewSnapMode;
  onMousePresetChange: (preset: StudioViewportMousePreset) => void;
  onViewSnapModeChange: (mode: StudioViewportViewSnapMode) => void;
};

export function StageInspectorNavigationCard(props: StageInspectorNavigationCardProps) {
  const { mousePreset, viewSnapMode, onMousePresetChange, onViewSnapModeChange } = props;

  return (
    <InspectorSettingsSectionFrame title="Viewport navigation" collapsible defaultExpanded>
      <div className="space-y-2.5">
        <TRNFormField
          label="Mouse preset"
          hint="Three.js uses LMB orbit. Blender uses MMB orbit, RMB pan, Shift+MMB pan."
        >
          <TRNSelect
            size="sm"
            value={mousePreset}
            options={[...MOUSE_PRESET_OPTIONS]}
            ariaLabel="Stage viewport mouse preset"
            onValueChange={(value) => {
              if (value === "three" || value === "blender") {
                onMousePresetChange(value);
              }
            }}
          />
        </TRNFormField>
        <TRNFormField
          label="View snap axis"
          hint="Numpad 1 / 3 / 7 / 9 — camera-relative follows current orbit; world-locked uses scene axes."
        >
          <TRNSelect
            size="sm"
            value={viewSnapMode}
            options={[...VIEW_SNAP_OPTIONS]}
            ariaLabel="Stage viewport view snap mode"
            onValueChange={(value) => {
              if (value === "camera-relative" || value === "world-locked") {
                onViewSnapModeChange(value);
              }
            }}
          />
        </TRNFormField>
        <TRNHintText>
          Numpad 5 — perspective / orthographic. Numpad . — frame selection. Home — reset camera.
        </TRNHintText>
      </div>
    </InspectorSettingsSectionFrame>
  );
}
