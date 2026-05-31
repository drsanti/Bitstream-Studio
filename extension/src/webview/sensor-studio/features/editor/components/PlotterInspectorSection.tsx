import { Activity } from "lucide-react";
import { useCallback, useMemo } from "react";
import {
  PLOTTER_INPUT_IDS,
  coercePlotterConfig,
  type PlotterChannelStyle,
  type PlotterConfig,
  type PlotterLineStyle,
  type PlotterMarkerStyle,
} from "../nodes/plotter/plotter-config";
import { useFlowEditorStore } from "../store/flow-editor.store";

type PlotterInspectorSectionProps = {
  defaultConfigRaw: Record<string, unknown>;
};

export function PlotterInspectorSection(props: PlotterInspectorSectionProps) {
  const { defaultConfigRaw } = props;
  const updatePlotter = useFlowEditorStore((s) => s.updateSelectedNodePlotterConfig);

  const cfg = useMemo(
    () => coercePlotterConfig(defaultConfigRaw),
    [defaultConfigRaw],
  );

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

  const controlClass =
    "w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-100";

  return (
    <div className="space-y-2 rounded border border-cyan-900/35 bg-zinc-950/45 p-2">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-200/90">
        <Activity className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
        Plotter
      </div>
      <p className="text-[10px] leading-snug text-zinc-500">
        Multi-channel trend chart — one point per flow update (typically each telemetry frame).
        Wire scalars to Ch 1–4.
      </p>

      <div className="space-y-1.5 rounded border border-zinc-700/70 bg-zinc-900/35 p-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Trace buffer
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-0.5">
            <span className="text-[10px] text-zinc-500">History length</span>
            <input
              type="number"
              className={controlClass}
              min={16}
              max={2048}
              step={16}
              value={cfg.historyLength}
              onChange={(e) =>
                patch((c) => ({ ...c, historyLength: Number(e.target.value) }))
              }
            />
          </label>
          <label className="space-y-0.5">
            <span className="text-[10px] text-zinc-500">Horizontal divisions</span>
            <input
              type="number"
              className={controlClass}
              min={2}
              max={32}
              step={1}
              value={cfg.timeDivisions}
              onChange={(e) =>
                patch((c) => ({ ...c, timeDivisions: Number(e.target.value) }))
              }
            />
          </label>
        </div>
      </div>

      <div className="space-y-1.5 rounded border border-zinc-700/70 bg-zinc-900/35 p-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Vertical scale (shared)
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-300">
          <input
            type="checkbox"
            className="rounded border-zinc-600"
            checked={cfg.autoScale}
            onChange={(e) => patch((c) => ({ ...c, autoScale: e.target.checked }))}
          />
          Auto-scale Y (fit traces)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-0.5">
            <span className="text-[10px] text-zinc-500">Y min</span>
            <input
              type="number"
              className={controlClass}
              disabled={cfg.autoScale}
              value={cfg.yMin}
              step="any"
              onChange={(e) => patch((c) => ({ ...c, yMin: Number(e.target.value) }))}
            />
          </label>
          <label className="space-y-0.5">
            <span className="text-[10px] text-zinc-500">Y max</span>
            <input
              type="number"
              className={controlClass}
              disabled={cfg.autoScale}
              value={cfg.yMax}
              step="any"
              onChange={(e) => patch((c) => ({ ...c, yMax: Number(e.target.value) }))}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-0.5">
            <span className="text-[10px] text-zinc-500">Gain</span>
            <input
              type="number"
              className={controlClass}
              min={0.001}
              step={0.05}
              value={cfg.verticalGain}
              onChange={(e) =>
                patch((c) => ({ ...c, verticalGain: Number(e.target.value) }))
              }
            />
          </label>
          <label className="space-y-0.5">
            <span className="text-[10px] text-zinc-500">Offset</span>
            <input
              type="number"
              className={controlClass}
              step="any"
              value={cfg.verticalOffset}
              onChange={(e) =>
                patch((c) => ({ ...c, verticalOffset: Number(e.target.value) }))
              }
            />
          </label>
        </div>
        <label className="space-y-0.5">
          <span className="text-[10px] text-zinc-500">Amplitude divisions</span>
          <input
            type="number"
            className={controlClass}
            min={2}
            max={24}
            step={1}
            value={cfg.ampDivisions}
            onChange={(e) =>
              patch((c) => ({ ...c, ampDivisions: Number(e.target.value) }))
            }
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 rounded border border-zinc-700/70 bg-zinc-900/35 px-2 py-1.5 text-[11px] text-zinc-300">
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            className="rounded border-zinc-600"
            checked={cfg.showGrid}
            onChange={(e) => patch((c) => ({ ...c, showGrid: e.target.checked }))}
          />
          Grid
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            className="rounded border-zinc-600"
            checked={cfg.showLegend}
            onChange={(e) => patch((c) => ({ ...c, showLegend: e.target.checked }))}
          />
          Legend
        </label>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Channels
        </div>
        {PLOTTER_INPUT_IDS.map((id) => {
          const ch = cfg.channels[id] ?? cfg.channels.ch1!;
          return (
            <div
              key={id}
              className="space-y-1.5 rounded border border-zinc-800/80 bg-black/25 p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase text-zinc-500">{id}</span>
                <label className="flex items-center gap-1 text-[10px] text-zinc-400">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-600"
                    checked={ch.visible}
                    onChange={(e) => patchChannel(id, { visible: e.target.checked })}
                  />
                  On
                </label>
              </div>
              <input
                type="text"
                className={controlClass}
                placeholder="Label"
                value={ch.label}
                onChange={(e) => patchChannel(id, { label: e.target.value })}
              />
              <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                <span className="text-[10px] text-zinc-500">Color</span>
                <input
                  type="color"
                  className="h-8 w-full cursor-pointer rounded border border-zinc-700 bg-zinc-900"
                  value={
                    /^#[0-9a-fA-F]{6}$/.test(ch.colorHex) ? ch.colorHex : "#22d3ee"
                  }
                  onChange={(e) => patchChannel(id, { colorHex: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500">Line</span>
                  <select
                    className={controlClass}
                    value={ch.lineStyle}
                    onChange={(e) =>
                      patchChannel(id, {
                        lineStyle: e.target.value as PlotterLineStyle,
                      })
                    }
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </label>
                <label className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500">Width</span>
                  <input
                    type="number"
                    className={controlClass}
                    min={0.5}
                    max={6}
                    step={0.25}
                    value={ch.lineWidthPx}
                    onChange={(e) =>
                      patchChannel(id, { lineWidthPx: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500">Marker</span>
                  <select
                    className={controlClass}
                    value={ch.marker}
                    onChange={(e) =>
                      patchChannel(id, {
                        marker: e.target.value as PlotterMarkerStyle,
                      })
                    }
                  >
                    <option value="none">None</option>
                    <option value="dots">Dots</option>
                    <option value="cross">Cross</option>
                  </select>
                </label>
                <label className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500">Every N pts</span>
                  <input
                    type="number"
                    className={controlClass}
                    min={1}
                    max={64}
                    step={1}
                    value={ch.markerEvery}
                    onChange={(e) =>
                      patchChannel(id, { markerEvery: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
