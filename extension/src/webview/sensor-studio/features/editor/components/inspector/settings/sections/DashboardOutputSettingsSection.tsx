import { dashboardOutputDefaultLayout } from "../../../../../../core/dashboard/dashboard-layout";
import {
  coerceDashboardLayoutV1,
  type DashboardLayoutModeV1,
} from "../../../../../../core/dashboard/dashboard-layout";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import { InspectorSelectField } from "../../InspectorDenseControls";
import { InspectorNumericField } from "../../InspectorNumericScrubRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import {
  coerceDashboardThemeV1,
  type DashboardThemePresetV1,
} from "../../../../../../core/dashboard/dashboard-theme";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const THEME_PRESET_OPTIONS: { value: DashboardThemePresetV1; label: string }[] = [
  { value: "studio-dark", label: "Studio dark" },
  { value: "high-contrast", label: "High contrast" },
  { value: "slate", label: "Slate" },
];

const LAYOUT_MODE_OPTIONS = [
  { value: "grid", label: "Grid" },
  { value: "flex", label: "Flex" },
] as const;

const FLEX_DIRECTION_OPTIONS = [
  { value: "row", label: "Row" },
  { value: "column", label: "Column" },
] as const;

const FLEX_ALIGN_OPTIONS = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
  { value: "stretch", label: "Stretch" },
] as const;

const FLEX_JUSTIFY_OPTIONS = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
  { value: "space-between", label: "Space between" },
  { value: "space-around", label: "Space around" },
] as const;

export function DashboardOutputSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const layout = coerceDashboardLayoutV1(dc.layout);
  const theme = coerceDashboardThemeV1(dc.theme);
  const { columns, gapPx, paddingPx, rowHeightPx } = layout.grid;
  const { direction, wrap, gapPx: flexGap, paddingPx: flexPad, alignItems, justifyContent } =
    layout.flex;

  const commitLayout = (patch: Partial<typeof layout> & { mode?: DashboardLayoutModeV1 }) => {
    const next = coerceDashboardLayoutV1({ ...layout, ...patch });
    onUpdateConfigField("layout", next);
    useFlowEditorStore.getState().tickSimulation();
  };

  const patchGrid = (patch: Partial<typeof layout.grid>) => {
    commitLayout({ grid: { ...layout.grid, ...patch } });
  };

  const patchFlex = (patch: Partial<typeof layout.flex>) => {
    commitLayout({ flex: { ...layout.flex, ...patch } });
  };

  return (
    <InspectorSettingsSectionFrame title="Dashboard Output">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Commits wired dashboard widgets to the{" "}
          <span className="font-medium text-zinc-400">Dashboard</span> workbench pane.
        </p>
        <DashboardOpenLink className="shrink-0" />
      </div>
      <InspectorSelectField
        label="Layout mode"
        value={layout.mode}
        options={LAYOUT_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        onChange={(v) => commitLayout({ mode: v === "flex" ? "flex" : "grid" })}
      />
      {layout.mode === "grid" ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <InspectorNumericField
            label="Grid columns"
            value={columns}
            min={1}
            max={24}
            step={1}
            onCommit={(v) => patchGrid({ columns: v })}
          />
          <InspectorNumericField
            label="Row height (px)"
            value={rowHeightPx}
            min={24}
            max={200}
            step={4}
            onCommit={(v) => patchGrid({ rowHeightPx: v })}
          />
          <InspectorNumericField
            label="Gap (px)"
            value={gapPx}
            min={0}
            max={64}
            step={1}
            onCommit={(v) => patchGrid({ gapPx: v })}
          />
          <InspectorNumericField
            label="Padding (px)"
            value={paddingPx}
            min={0}
            max={96}
            step={1}
            onCommit={(v) => patchGrid({ paddingPx: v })}
          />
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <InspectorSelectField
              label="Direction"
              value={direction}
              options={FLEX_DIRECTION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              onChange={(v) => patchFlex({ direction: v === "column" ? "column" : "row" })}
            />
            <InspectorSelectField
              label="Align items"
              value={alignItems}
              options={FLEX_ALIGN_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              onChange={(v) =>
                patchFlex({
                  alignItems:
                    v === "center" || v === "end" || v === "stretch" ? v : "start",
                })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <InspectorSelectField
              label="Justify"
              value={justifyContent}
              options={FLEX_JUSTIFY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              onChange={(v) =>
                patchFlex({
                  justifyContent:
                    v === "center" ||
                    v === "end" ||
                    v === "space-between" ||
                    v === "space-around"
                      ? v
                      : "start",
                })
              }
            />
            <InspectorSelectField
              label="Wrap"
              value={wrap ? "yes" : "no"}
              options={[
                { value: "yes", label: "Wrap" },
                { value: "no", label: "No wrap" },
              ]}
              onChange={(v) => patchFlex({ wrap: v === "yes" })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <InspectorNumericField
              label="Gap (px)"
              value={flexGap}
              min={0}
              max={64}
              step={1}
              onCommit={(v) => patchFlex({ gapPx: v })}
            />
            <InspectorNumericField
              label="Padding (px)"
              value={flexPad}
              min={0}
              max={96}
              step={1}
              onCommit={(v) => patchFlex({ paddingPx: v })}
            />
          </div>
        </div>
      )}
      <p className="mt-2 text-[10px] leading-snug text-zinc-600">
        Default grid: {dashboardOutputDefaultLayout().grid.columns} columns. Use{" "}
        <span className="font-medium text-zinc-500">Edit</span> mode in the Dashboard pane to
        select widgets.
      </p>
      <div className="mt-4 border-t border-zinc-800/80 pt-3">
        <InspectorSelectField
          label="Fallback theme"
          value={theme.preset}
          options={THEME_PRESET_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(v) => {
            const preset =
              v === "high-contrast" || v === "slate" ? v : ("studio-dark" as DashboardThemePresetV1);
            onUpdateConfigField("theme", coerceDashboardThemeV1({ version: 1, preset }));
            useFlowEditorStore.getState().tickSimulation();
          }}
        />
        <p className="mt-1 text-[10px] leading-snug text-zinc-600">
          Used when no <span className="font-medium text-zinc-500">Theme</span> wire is connected.
          Wire a <span className="font-medium text-zinc-500">Dashboard Theme</span> node to override.
        </p>
      </div>
    </InspectorSettingsSectionFrame>
  );
}
