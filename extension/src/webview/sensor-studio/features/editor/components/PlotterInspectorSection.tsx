import {
  ArrowDownUp,
  LayoutGrid,
  LineChart,
  Timer,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { TRNSelectOption } from "../../../../ui/TRN";
import { TRNButton, TRNChipButtonGroup } from "../../../../ui/TRN";
import { writeClipboardText } from "../../../../ui/utils/clipboard";
import {
  buildPlotterHistoryCsv,
  computePlotterChannelStats,
  formatPlotterStat,
} from "../nodes/plotter/plotter-channel-stats";
import { PLOTTER_HISTORY_LENGTH_PRESETS } from "../nodes/plotter/plotter-history-presets";
import {
  PLOTTER_INPUT_IDS,
  coercePlotterConfig,
  type PlotterChannelStyle,
  type PlotterChannelColorMode,
  type PlotterConfig,
  type PlotterInputId,
} from "../nodes/plotter/plotter-config";
import { resolvePlotterChannelColors, resolvePlotterWireSemanticColorHex } from "../nodes/plotter/plotter-channel-colors";
import {
  computePlotterAutoYRange,
  formatPlotterYRangeSummary,
} from "../nodes/plotter/plotter-y-range";
import type { StudioNode } from "../store/flow-editor.store";
import { useFlowEditorStore } from "../store/flow-editor.store";
import { InspectorCollapsibleSection } from "./inspector/InspectorCollapsibleSection";
import { InspectorCompactToggleRow } from "./inspector/InspectorCompactToggleRow";
import { InspectorColorField, InspectorSelectRow } from "./inspector/InspectorDenseControls";
import { InspectorPropertyRow } from "./inspector/InspectorPropertyRow";
import {
  InspectorNumericScrubRow,
  InspectorTextRow,
} from "./inspector/InspectorNumericScrubRow";
import { InspectorSegmentButtonGroup } from "./inspector/InspectorSegmentButtonGroup";

const PLOTTER_GAIN_PRESETS = [0.25, 0.5, 1, 2, 5] as const;

const LINE_STYLE_OPTIONS: TRNSelectOption[] = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
];

const MARKER_STYLE_OPTIONS: TRNSelectOption[] = [
  { value: "none", label: "None" },
  { value: "dots", label: "Dots" },
  { value: "cross", label: "Cross" },
];

const CHANNEL_TAB_OPTIONS = PLOTTER_INPUT_IDS.map((id, index) => ({
  value: id,
  label: `Ch ${index + 1}`,
  hint: `Edit channel ${index + 1} label, color, and line styling.`,
}));

type PlotterChannelWireHint = {
  sourceLabel: string;
  handleLabel: string;
};

function resolvePlotterChannelWireHints(
  selectedNodeId: string,
  edges: ReturnType<typeof useFlowEditorStore.getState>["edges"],
  nodes: ReturnType<typeof useFlowEditorStore.getState>["nodes"],
): Record<PlotterInputId, PlotterChannelWireHint | null> {
  const hints = {} as Record<PlotterInputId, PlotterChannelWireHint | null>;
  for (const id of PLOTTER_INPUT_IDS) {
    const edge = edges.find(
      (e) => e.target === selectedNodeId && (e.targetHandle ?? "in") === id,
    );
    if (edge == null) {
      hints[id] = null;
      continue;
    }
    const source = nodes.find((node) => node.id === edge.source);
    const sourceLabel =
      source?.data.label.trim().length > 0
        ? source.data.label.trim()
        : (source?.data.nodeId ?? "Unknown");
    hints[id] = {
      sourceLabel,
      handleLabel: edge.sourceHandle ?? "out",
    };
  }
  return hints;
}

function PlotterStatusStrip(props: { cfg: PlotterConfig; livePointCount: number }) {
  const { cfg, livePointCount } = props;
  const items = [
    cfg.pauseAcquisition ? "Paused" : "Live",
    `${cfg.historyLength} pt buffer`,
    cfg.autoScale ? "Auto Y" : "Fixed Y",
    cfg.showGrid ? "Grid" : null,
    cfg.showLegend ? "Legend" : null,
    livePointCount > 0 ? `${livePointCount} samples` : null,
  ].filter((item): item is string => item != null);

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span
          key={item}
          className="rounded border border-zinc-700/80 bg-zinc-900/50 px-1.5 py-0.5 text-[10px] text-zinc-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export type PlotterInspectorSectionProps = {
  selectedNode: StudioNode;
};

export function PlotterInspectorSection(props: PlotterInspectorSectionProps) {
  const { selectedNode } = props;
  const defaultConfigRaw = selectedNode.data.defaultConfig;
  const updatePlotter = useFlowEditorStore((s) => s.updateSelectedNodePlotterConfig);
  const clearHistory = useFlowEditorStore((s) => s.clearSelectedPlotterHistory);
  const edges = useFlowEditorStore((s) => s.edges);
  const nodes = useFlowEditorStore((s) => s.nodes);

  const [activeChannelId, setActiveChannelId] = useState<PlotterInputId>("ch1");

  const cfg = useMemo(
    () => coercePlotterConfig(defaultConfigRaw),
    [defaultConfigRaw],
  );

  const livePlotHistory = selectedNode.data.livePlotHistory ?? {};
  const wireHints = useMemo(
    () => resolvePlotterChannelWireHints(selectedNode.id, edges, nodes),
    [selectedNode.id, edges, nodes],
  );
  const channelColors = useMemo(
    () =>
      resolvePlotterChannelColors({
        plotterFlowNodeId: selectedNode.id,
        config: cfg,
        edges,
        nodes,
      }),
    [selectedNode.id, cfg, edges, nodes],
  );

  const livePointCount = useMemo(() => {
    let max = 0;
    for (const id of PLOTTER_INPUT_IDS) {
      max = Math.max(max, livePlotHistory[id]?.length ?? 0);
    }
    return max;
  }, [livePlotHistory]);

  const patch = useCallback(
    (fn: (c: PlotterConfig) => PlotterConfig) => {
      const cur = coercePlotterConfig(defaultConfigRaw);
      updatePlotter(fn(cur));
    },
    [defaultConfigRaw, updatePlotter],
  );

  const patchChannel = useCallback(
    (channelId: string, chPatch: Partial<PlotterChannelStyle>) => {
      patch((c) => {
        const prev = c.channels[channelId] ?? c.channels.ch1!;
        return {
          ...c,
          channels: {
            ...c.channels,
            [channelId]: { ...prev, ...chPatch },
          },
        };
      });
    },
    [patch],
  );

  const activeChannel = cfg.channels[activeChannelId] ?? cfg.channels.ch1!;
  const activeWire = wireHints[activeChannelId];
  const activeTraceColor = channelColors[activeChannelId] ?? activeChannel.colorHex;
  const activeWireSemanticColor = useMemo(
    () =>
      resolvePlotterWireSemanticColorHex({
        plotterFlowNodeId: selectedNode.id,
        channelId: activeChannelId,
        fallbackHex: activeChannel.colorHex,
        edges,
        nodes,
      }),
    [selectedNode.id, activeChannelId, activeChannel.colorHex, edges, nodes],
  );
  const activeHistory = livePlotHistory[activeChannelId] ?? [];
  const activeStats = useMemo(
    () => computePlotterChannelStats(activeHistory),
    [activeHistory],
  );

  const historyPresetOptions = useMemo(
    () =>
      PLOTTER_HISTORY_LENGTH_PRESETS.map((preset) => ({
        value: preset,
        label: String(preset),
      })),
    [],
  );

  const gainPresetOptions = useMemo(
    () =>
      PLOTTER_GAIN_PRESETS.map((preset) => ({
        value: preset,
        label: preset >= 1 ? String(preset) : preset.toFixed(2),
      })),
    [],
  );

  const nearestGainPreset = PLOTTER_GAIN_PRESETS.reduce((best, preset) =>
    Math.abs(preset - cfg.verticalGain) < Math.abs(best - cfg.verticalGain) ? preset : best,
  );

  const liveAutoYRange = useMemo(
    () =>
      computePlotterAutoYRange({
        histories: livePlotHistory,
        channelOrder: PLOTTER_INPUT_IDS,
        channels: cfg.channels,
        historyLength: cfg.historyLength,
        verticalGain: cfg.verticalGain,
        verticalOffset: cfg.verticalOffset,
      }),
    [
      livePlotHistory,
      cfg.channels,
      cfg.historyLength,
      cfg.verticalGain,
      cfg.verticalOffset,
    ],
  );

  const applyFitToLiveYRange = useCallback(() => {
    const range = computePlotterAutoYRange({
      histories: livePlotHistory,
      channelOrder: PLOTTER_INPUT_IDS,
      channels: cfg.channels,
      historyLength: cfg.historyLength,
      verticalGain: cfg.verticalGain,
      verticalOffset: cfg.verticalOffset,
    });
    if (range == null) {
      return;
    }
    patch((c) => ({ ...c, yMin: range.yMin, yMax: range.yMax }));
  }, [cfg.channels, cfg.historyLength, cfg.verticalGain, cfg.verticalOffset, livePlotHistory, patch]);

  const channelLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const id of PLOTTER_INPUT_IDS) {
      labels[id] = cfg.channels[id]?.label ?? id;
    }
    return labels;
  }, [cfg.channels]);

  const copyCsv = useCallback(async () => {
    const csv = buildPlotterHistoryCsv({
      histories: livePlotHistory,
      channelOrder: PLOTTER_INPUT_IDS,
      channelLabels,
    });
    await writeClipboardText(csv);
  }, [channelLabels, livePlotHistory]);

  return (
    <div className="space-y-2">
      <div className="px-0.5">
        <PlotterStatusStrip cfg={cfg} livePointCount={livePointCount} />
      </div>

      <InspectorCollapsibleSection
        title="Acquisition"
        icon={<Timer className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Trace buffer depth and horizontal grid divisions. Buffer size is not sample rate in Hz."
        defaultExpanded
      >
        <div className="space-y-1.5">
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            History preset
          </div>
          <TRNChipButtonGroup
            ariaLabel="Plotter history length preset"
            value={cfg.historyLength}
            options={historyPresetOptions}
            columns={4}
            size="sm"
            onChange={(next) => {
              patch((c) => ({ ...c, historyLength: next }));
            }}
          />
        </div>
        <InspectorNumericScrubRow
          label="History length"
          description="Points retained per channel (16–2048)."
          ariaLabel="Plotter history length"
          value={cfg.historyLength}
          min={16}
          max={2048}
          step={16}
          onCommit={(next) => {
            patch((c) => ({ ...c, historyLength: Math.round(next) }));
          }}
        />
        <InspectorNumericScrubRow
          label="Time divisions"
          description="Vertical grid lines across the plot width."
          ariaLabel="Plotter time divisions"
          value={cfg.timeDivisions}
          min={2}
          max={32}
          step={1}
          onCommit={(next) => {
            patch((c) => ({ ...c, timeDivisions: Math.round(next) }));
          }}
        />
        <InspectorCompactToggleRow
          label="Pause capture"
          hint="Freeze the trace buffer — existing samples stay visible until cleared."
          checked={cfg.pauseAcquisition}
          onCheckedChange={(next) => {
            patch((c) => ({ ...c, pauseAcquisition: next }));
          }}
        />
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <TRNButton
            size="compact"
            className="min-w-0 flex-1"
            hint="Remove all samples from the trace buffer."
            disabled={livePointCount === 0}
            onClick={() => clearHistory()}
          >
            Clear traces
          </TRNButton>
          <TRNButton
            size="compact"
            className="min-w-0 flex-1"
            hint="Copy all channel histories as CSV to the clipboard."
            disabled={livePointCount === 0}
            onClick={() => void copyCsv()}
          >
            Copy CSV
          </TRNButton>
        </div>
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Y axis"
        icon={<ArrowDownUp className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Shared vertical scale for all visible traces."
        defaultExpanded
      >
        <InspectorCompactToggleRow
          label="Auto-scale Y"
          hint="Fit all visible traces into the plot area. Turn off to set fixed Y min and max."
          checked={cfg.autoScale}
          onCheckedChange={(next) => {
            patch((c) => {
              if (next) {
                return { ...c, autoScale: true };
              }
              const range = computePlotterAutoYRange({
                histories: livePlotHistory,
                channelOrder: PLOTTER_INPUT_IDS,
                channels: c.channels,
                historyLength: c.historyLength,
                verticalGain: c.verticalGain,
                verticalOffset: c.verticalOffset,
              });
              if (range == null) {
                return { ...c, autoScale: false };
              }
              return {
                ...c,
                autoScale: false,
                yMin: range.yMin,
                yMax: range.yMax,
              };
            });
          }}
        />

        {cfg.autoScale ? (
          liveAutoYRange != null ? (
            <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-1.5 text-[10px] leading-snug text-zinc-400">
              <span className="font-medium text-zinc-300">Live range</span>{" "}
              {formatPlotterYRangeSummary(liveAutoYRange)}
            </div>
          ) : null
        ) : (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  Fixed limits
                </div>
                <TRNButton
                  type="button"
                  size="compact"
                  className="h-[22px] shrink-0 px-2 text-[10px]"
                  hint="Set Y min and max from the current visible trace data."
                  disabled={liveAutoYRange == null}
                  onClick={applyFitToLiveYRange}
                >
                  Fit to data
                </TRNButton>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <InspectorNumericScrubRow
                  label="Y min"
                  ariaLabel="Plotter Y minimum"
                  value={cfg.yMin}
                  step={0.05}
                  onCommit={(next) => {
                    patch((c) => ({ ...c, yMin: next }));
                  }}
                />
                <InspectorNumericScrubRow
                  label="Y max"
                  ariaLabel="Plotter Y maximum"
                  value={cfg.yMax}
                  step={0.05}
                  onCommit={(next) => {
                    patch((c) => ({ ...c, yMax: next }));
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Scale & shift
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <InspectorNumericScrubRow
                  label="Gain"
                  ariaLabel="Plotter vertical gain"
                  value={cfg.verticalGain}
                  min={0.001}
                  max={1e6}
                  step={0.05}
                  onCommit={(next) => {
                    patch((c) => ({ ...c, verticalGain: next }));
                  }}
                />
                <InspectorNumericScrubRow
                  label="Offset"
                  ariaLabel="Plotter vertical offset"
                  value={cfg.verticalOffset}
                  step={0.05}
                  onCommit={(next) => {
                    patch((c) => ({ ...c, verticalOffset: next }));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  Gain preset
                </div>
                <TRNChipButtonGroup
                  ariaLabel="Plotter vertical gain preset"
                  value={nearestGainPreset}
                  options={gainPresetOptions}
                  columns={5}
                  size="sm"
                  onChange={(next) => {
                    patch((c) => ({ ...c, verticalGain: next }));
                  }}
                />
              </div>
            </div>
          </>
        )}

        <InspectorNumericScrubRow
          label="Amplitude divisions"
          description="Horizontal grid lines across the plot height."
          ariaLabel="Plotter amplitude divisions"
          value={cfg.ampDivisions}
          min={2}
          max={24}
          step={1}
          onCommit={(next) => {
            patch((c) => ({ ...c, ampDivisions: Math.round(next) }));
          }}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Display"
        icon={<LayoutGrid className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Grid and legend drawn on the plotter canvas."
        defaultExpanded
      >
        <InspectorCompactToggleRow
          label="Show grid"
          hint="Draw time and amplitude division lines on the canvas."
          checked={cfg.showGrid}
          onCheckedChange={(next) => {
            patch((c) => ({ ...c, showGrid: next }));
          }}
        />
        <InspectorCompactToggleRow
          label="Show legend"
          hint="Channel labels and color swatches below the plot."
          checked={cfg.showLegend}
          onCheckedChange={(next) => {
            patch((c) => ({ ...c, showLegend: next }));
          }}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Channels"
        icon={<LineChart className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Label, color, and line styling for each input pin."
        defaultExpanded
        badge={
          <span className="rounded border border-zinc-700/80 px-1.5 py-0.5 text-[10px] text-zinc-400">
            4
          </span>
        }
      >
        <InspectorSegmentButtonGroup
          ariaLabel="Plotter channel"
          layout="row"
          value={activeChannelId}
          options={CHANNEL_TAB_OPTIONS}
          onChange={setActiveChannelId}
        />

        <InspectorCompactToggleRow
          label="Show trace in chart"
          hint="Hide this channel's line without clearing its history."
          checked={activeChannel.visible}
          onCheckedChange={(next) => {
            patchChannel(activeChannelId, { visible: next });
          }}
        />
        <InspectorTextRow
          label="Label"
          description="Legend and inspector caption for this trace."
          ariaLabel={`Plotter ${activeChannelId} label`}
          value={activeChannel.label}
          placeholder={`Ch ${PLOTTER_INPUT_IDS.indexOf(activeChannelId) + 1}`}
          onChange={(next) => {
            patchChannel(activeChannelId, { label: next });
          }}
        />
        <InspectorSegmentButtonGroup
          ariaLabel="Plotter trace color source"
          layout="grid-2"
          value={activeChannel.colorMode}
          options={[
            {
              value: "followWire",
              label: "Follow wire",
              hint: "Match upstream socket semantics (axis X/Y/Z/W or sensor tint).",
            },
            {
              value: "custom",
              label: "Custom",
              hint: "Fixed color from the picker below.",
            },
          ]}
          onChange={(next) => {
            patchChannel(activeChannelId, { colorMode: next as PlotterChannelColorMode });
          }}
        />
        {activeChannel.colorMode === "custom" ? (
          <InspectorPropertyRow
            label="Trace color"
            description="Custom trace color. Use the ring, screen eyedropper, or match the wired socket."
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <InspectorColorField
                  ariaLabel={`Plotter ${activeChannelId} color`}
                  value={
                    /^#[0-9a-fA-F]{6}$/.test(activeChannel.colorHex)
                      ? activeChannel.colorHex
                      : "#22d3ee"
                  }
                  onChange={(next) => {
                    patchChannel(activeChannelId, { colorHex: next });
                  }}
                />
              </div>
              {activeWireSemanticColor != null ? (
                <TRNButton
                  type="button"
                  size="compact"
                  className="h-[26px] shrink-0 px-2 text-[10px]"
                  hint={`Use wired socket color (${activeWireSemanticColor})${
                    activeWire != null
                      ? ` from ${activeWire.sourceLabel} · ${activeWire.handleLabel}`
                      : ""
                  }`}
                  aria-label={`Use wire color for ${activeChannelId}`}
                  onClick={() => {
                    patchChannel(activeChannelId, { colorHex: activeWireSemanticColor });
                  }}
                >
                  Wire
                </TRNButton>
              ) : null}
            </div>
          </InspectorPropertyRow>
        ) : (
          <InspectorPropertyRow
            label="Wire color"
            description={
              activeWire != null
                ? `${activeWire.sourceLabel} · ${activeWire.handleLabel}`
                : "Connect a wire to inherit semantic color."
            }
          >
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-3 w-6 shrink-0 rounded-sm border border-zinc-600/70"
                style={{ backgroundColor: activeTraceColor }}
                aria-hidden
              />
              <span className="text-[10px] text-zinc-400">{activeTraceColor}</span>
            </span>
          </InspectorPropertyRow>
        )}
        <InspectorSelectRow
          label="Line style"
          ariaLabel={`Plotter ${activeChannelId} line style`}
          value={activeChannel.lineStyle}
          options={LINE_STYLE_OPTIONS}
          onChange={(next) => {
            patchChannel(activeChannelId, { lineStyle: next as PlotterChannelStyle["lineStyle"] });
          }}
        />
        <div className="grid grid-cols-2 gap-1.5">
          <InspectorNumericScrubRow
            label="Line width"
            ariaLabel={`Plotter ${activeChannelId} line width`}
            value={activeChannel.lineWidthPx}
            min={0.5}
            max={6}
            step={0.25}
            onCommit={(next) => {
              patchChannel(activeChannelId, { lineWidthPx: next });
            }}
          />
          <InspectorNumericScrubRow
            label="Marker every N"
            ariaLabel={`Plotter ${activeChannelId} marker interval`}
            value={activeChannel.markerEvery}
            min={1}
            max={64}
            step={1}
            onCommit={(next) => {
              patchChannel(activeChannelId, { markerEvery: Math.round(next) });
            }}
          />
        </div>
        <InspectorSelectRow
          label="Marker style"
          ariaLabel={`Plotter ${activeChannelId} marker style`}
          value={activeChannel.marker}
          options={MARKER_STYLE_OPTIONS}
          onChange={(next) => {
            patchChannel(activeChannelId, { marker: next as PlotterChannelStyle["marker"] });
          }}
        />

        <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-1.5 text-[11px] leading-snug text-zinc-400">
          {activeWire != null ? (
            <p>
              <span className="font-medium text-zinc-300">Wired:</span>{" "}
              {activeWire.sourceLabel} · {activeWire.handleLabel}
            </p>
          ) : (
            <p className="text-zinc-500">Unwired — connect a scalar output to this channel pin.</p>
          )}
          {activeStats != null ? (
            <p className="mt-1 text-zinc-500">
              Last {formatPlotterStat(activeStats.last)} · min {formatPlotterStat(activeStats.min)} · max{" "}
              {formatPlotterStat(activeStats.max)} · mean {formatPlotterStat(activeStats.mean)} ·{" "}
              {activeStats.count} pts
            </p>
          ) : (
            <p className="mt-1 text-zinc-600">No samples yet.</p>
          )}
        </div>
      </InspectorCollapsibleSection>
    </div>
  );
}
