import { AlignVerticalJustifyCenter } from "lucide-react";
import { TRNButton, TRNHintText } from "../../../../../ui/TRN";
import {
  coerceDashboardLayoutV1,
  dashboardOutputDefaultLayout,
  type DashboardLayoutModeV1,
} from "../../../../core/dashboard/dashboard-layout";
import {
  coerceDashboardThemeV1,
  type DashboardThemePresetV1,
} from "../../../../core/dashboard/dashboard-theme";
import type { DashboardSnapshotItemV1, DashboardSnapshotV1 } from "../../../../core/dashboard/dashboard-snapshot";
import { downloadDashboardLayoutJson } from "../../../../core/dashboard/dashboard-layout-export";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { InspectorSelectField } from "./InspectorDenseControls";
import { InspectorNumericField } from "./InspectorNumericScrubRow";
import { DashboardInspectorLayoutWarningsSection } from "./DashboardInspectorLayoutWarningsSection";
import { InspectorSettingsSectionFrame } from "./InspectorSettingsSectionFrame";

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

type DashboardInspectorLayoutTabProps = {
  dashboardOutputNodeId: string | null;
  dashboardSnapshot: DashboardSnapshotV1;
  displayItems: readonly DashboardSnapshotItemV1[];
  pageLayoutWarnings: readonly string[];
  onImportLayoutPick: () => void;
};

export function DashboardInspectorLayoutTab(props: DashboardInspectorLayoutTabProps) {
  const { dashboardOutputNodeId, dashboardSnapshot, displayItems, pageLayoutWarnings, onImportLayoutPick } =
    props;
  const nodes = useFlowEditorStore((s) => s.nodes);
  const updateNodeConfigFieldByNodeId = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const tickSimulation = useFlowEditorStore((s) => s.tickSimulation);
  const arrangeDashboardWidgetsStacked = useFlowEditorStore((s) => s.arrangeDashboardWidgetsStacked);

  const outputNode =
    dashboardOutputNodeId == null
      ? null
      : (nodes.find((n) => n.id === dashboardOutputNodeId) ?? null);

  if (outputNode == null) {
    return (
      <TRNHintText className="text-zinc-500">
        Add and wire a <span className="font-medium text-zinc-400">Dashboard Output</span> node to
        edit layout settings here.
      </TRNHintText>
    );
  }

  const dc = outputNode.data.defaultConfig as Record<string, unknown>;
  const layout = coerceDashboardLayoutV1(dc.layout);
  const theme = coerceDashboardThemeV1(dc.theme);
  const { columns, gapPx, paddingPx, rowHeightPx } = layout.grid;
  const { direction, wrap, gapPx: flexGap, paddingPx: flexPad, alignItems, justifyContent } =
    layout.flex;

  const patchField = (key: string, value: unknown) => {
    updateNodeConfigFieldByNodeId(outputNode.id, key, value);
    tickSimulation();
  };

  const commitLayout = (patch: Partial<typeof layout> & { mode?: DashboardLayoutModeV1 }) => {
    patchField("layout", coerceDashboardLayoutV1({ ...layout, ...patch }));
  };

  const patchGrid = (patch: Partial<typeof layout.grid>) => {
    commitLayout({ grid: { ...layout.grid, ...patch } });
  };

  const patchFlex = (patch: Partial<typeof layout.flex>) => {
    commitLayout({ flex: { ...layout.flex, ...patch } });
  };

  return (
    <div className="space-y-2">
      <DashboardInspectorLayoutWarningsSection warnings={pageLayoutWarnings} />
      <InspectorSettingsSectionFrame title="Grid & flex" collapsible defaultExpanded>
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
          Default grid: {dashboardOutputDefaultLayout().grid.columns} columns. Changes apply to the
          wired Dashboard Output node.
        </p>
      </InspectorSettingsSectionFrame>

      <InspectorSettingsSectionFrame title="Theme" collapsible defaultExpanded>
        <InspectorSelectField
          label="Fallback theme"
          value={theme.preset}
          options={THEME_PRESET_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(v) => {
            const preset =
              v === "high-contrast" || v === "slate" ? v : ("studio-dark" as DashboardThemePresetV1);
            patchField("theme", coerceDashboardThemeV1({ version: 1, preset }));
          }}
        />
      </InspectorSettingsSectionFrame>

      <InspectorSettingsSectionFrame title="Actions" collapsible defaultExpanded>
        {layout.mode === "grid" ? (
          <TRNButton
            type="button"
            size="compact"
            className="mb-2 w-full"
            hint="Stack visible widgets in column 1"
            onClick={() => arrangeDashboardWidgetsStacked(displayItems)}
          >
            <AlignVerticalJustifyCenter className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
            Stack widgets
          </TRNButton>
        ) : null}
        <div className="flex flex-wrap gap-1">
          <TRNButton
            type="button"
            size="compact"
            hint="Download layout JSON from the committed dashboard snapshot"
            onClick={() => downloadDashboardLayoutJson(dashboardSnapshot)}
          >
            Export
          </TRNButton>
          <TRNButton
            type="button"
            size="compact"
            hint="Import layout JSON from a file"
            onClick={onImportLayoutPick}
          >
            Import
          </TRNButton>
        </div>
        <p className="mt-2 text-[10px] text-zinc-600">
          Import updates matching flow nodes. Use the Dashboard toolbar for Save-to-library.
        </p>
      </InspectorSettingsSectionFrame>
    </div>
  );
}
