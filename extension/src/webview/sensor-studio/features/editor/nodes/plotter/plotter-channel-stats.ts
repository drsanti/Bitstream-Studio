export type PlotterChannelStats = {
  count: number;
  last: number;
  min: number;
  max: number;
  mean: number;
};

export function computePlotterChannelStats(samples: readonly number[]): PlotterChannelStats | null {
  const finite = samples.filter((v) => Number.isFinite(v));
  if (finite.length === 0) {
    return null;
  }
  let min = finite[0]!;
  let max = finite[0]!;
  let sum = 0;
  for (const v of finite) {
    if (v < min) {
      min = v;
    }
    if (v > max) {
      max = v;
    }
    sum += v;
  }
  return {
    count: finite.length,
    last: finite[finite.length - 1]!,
    min,
    max,
    mean: sum / finite.length,
  };
}

export function formatPlotterStat(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const abs = Math.abs(value);
  if (abs >= 100) {
    return value.toFixed(1);
  }
  if (abs >= 1) {
    return value.toFixed(3);
  }
  return value.toFixed(4);
}

/** One row per sample index; missing values are blank cells. */
export function buildPlotterHistoryCsv(args: {
  histories: Record<string, number[]>;
  channelOrder: readonly string[];
  channelLabels: Record<string, string>;
}): string {
  const { histories, channelOrder, channelLabels } = args;
  const headers = channelOrder.map((id) => channelLabels[id] ?? id);
  const maxLen = channelOrder.reduce(
    (acc, id) => Math.max(acc, histories[id]?.length ?? 0),
    0,
  );
  const rows: string[] = [headers.map(escapeCsvCell).join(",")];
  for (let i = 0; i < maxLen; i += 1) {
    const cells = channelOrder.map((id) => {
      const v = histories[id]?.[i];
      return v != null && Number.isFinite(v) ? String(v) : "";
    });
    rows.push(cells.map(escapeCsvCell).join(","));
  }
  return rows.join("\n");
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
