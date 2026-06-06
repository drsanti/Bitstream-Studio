/** Common trace buffer depths for the Plotter inspector preset chips. */
export const PLOTTER_HISTORY_LENGTH_PRESETS = [128, 256, 512, 1024] as const;

export type PlotterHistoryLengthPreset = (typeof PLOTTER_HISTORY_LENGTH_PRESETS)[number];

export function isPlotterHistoryLengthPreset(value: number): value is PlotterHistoryLengthPreset {
  return (PLOTTER_HISTORY_LENGTH_PRESETS as readonly number[]).includes(value);
}
