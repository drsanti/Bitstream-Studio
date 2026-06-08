import { InspectorSelectField } from "../../InspectorDenseControls";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  coerceDashboardThemeV1,
  type DashboardThemePresetV1,
} from "../../../../../../core/dashboard/dashboard-theme";

const PRESET_OPTIONS: { value: DashboardThemePresetV1; label: string }[] = [
  { value: "studio-dark", label: "Studio dark" },
  { value: "high-contrast", label: "High contrast" },
  { value: "slate", label: "Slate" },
];

export function DashboardThemeNodeSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const theme = coerceDashboardThemeV1(dc.theme);

  const applyPreset = (preset: DashboardThemePresetV1) => {
    const next = coerceDashboardThemeV1({ version: 1, preset });
    onUpdateConfigField("theme", next);
  };

  return (
    <InspectorSettingsSectionFrame title="Dashboard Theme">
      <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
        Outputs a theme wire for <span className="font-medium text-zinc-400">Dashboard Output</span>.
        Overrides canvas, panel, accent, and text colors on the Dashboard pane.
      </p>
      <InspectorSelectField
        label="Preset"
        value={theme.preset}
        options={PRESET_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        onChange={(v) =>
          applyPreset(v === "high-contrast" || v === "slate" ? v : "studio-dark")
        }
      />
      <p className="mt-2 text-[10px] leading-snug text-zinc-600">
        Accent {theme.accentColor} · Canvas {theme.canvasBackground}
      </p>
    </InspectorSettingsSectionFrame>
  );
}
