import { formatPlotterStat } from "./plotter-channel-stats";
import type { PlotterChannelStyle } from "./plotter-config";

export type PlotterAutoYRange = {
  yMin: number;
  yMax: number;
};

function transformPlotterSample(
  value: number,
  verticalGain: number,
  verticalOffset: number,
): number {
  return value * verticalGain + verticalOffset;
}

/** Visible channel samples after gain/offset — same transform as {@link PlotterCanvas}. */
export function collectPlotterTransformedSamples(args: {
  histories: Record<string, readonly number[]>;
  channelOrder: readonly string[];
  channels: Record<string, PlotterChannelStyle>;
  historyLength: number;
  verticalGain: number;
  verticalOffset: number;
}): number[] {
  const {
    histories,
    channelOrder,
    channels,
    historyLength,
    verticalGain,
    verticalOffset,
  } = args;
  const out: number[] = [];
  for (const id of channelOrder) {
    const sty = channels[id];
    if (sty == null || sty.visible !== true) {
      continue;
    }
    const raw = histories[id] ?? [];
    const slice = raw.slice(-historyLength);
    for (const v of slice) {
      if (!Number.isFinite(v)) {
        continue;
      }
      out.push(transformPlotterSample(v, verticalGain, verticalOffset));
    }
  }
  return out;
}

/** Auto-scale Y window (8% padding) shared by canvas and inspector. */
export function computePlotterAutoYRange(args: {
  histories: Record<string, readonly number[]>;
  channelOrder: readonly string[];
  channels: Record<string, PlotterChannelStyle>;
  historyLength: number;
  verticalGain: number;
  verticalOffset: number;
}): PlotterAutoYRange | null {
  const samples = collectPlotterTransformedSamples(args);
  if (samples.length === 0) {
    return null;
  }

  let lo = Infinity;
  let hi = -Infinity;
  for (const t of samples) {
    lo = Math.min(lo, t);
    hi = Math.max(hi, t);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return { yMin: -1, yMax: 1 };
  }
  if (Math.abs(hi - lo) < 1e-9) {
    lo -= 0.5;
    hi += 0.5;
  }
  const padY = (hi - lo) * 0.08;
  return { yMin: lo - padY, yMax: hi + padY };
}

export function formatPlotterYRangeSummary(range: PlotterAutoYRange): string {
  const span = range.yMax - range.yMin;
  return `min ${formatPlotterStat(range.yMin)} · max ${formatPlotterStat(range.yMax)} · span ${formatPlotterStat(span)}`;
}
