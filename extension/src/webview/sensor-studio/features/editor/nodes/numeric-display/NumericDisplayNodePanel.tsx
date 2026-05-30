/** Large digital readout node panel — HTML/CSS. */

type Zone = { from: number; to: number; color: string };

type NumericDisplayConfig = {
  label: string;
  unit: string;
  decimals: number;
  zones: Zone[];
  showStatusBar: boolean;
};

function coerceConfig(dc: Record<string, unknown>): NumericDisplayConfig {
  return {
    label: typeof dc.label === "string" ? dc.label : "",
    unit: typeof dc.unit === "string" ? dc.unit : "",
    decimals: typeof dc.decimals === "number" ? Math.max(0, Math.min(6, Math.round(dc.decimals))) : 2,
    showStatusBar: dc.showStatusBar !== false,
    zones: Array.isArray(dc.zones)
      ? (dc.zones as Zone[]).filter(
          (z) => typeof z?.from === "number" && typeof z?.to === "number" && typeof z?.color === "string",
        )
      : [],
  };
}

function zoneColor(zones: Zone[], value: number, fallback: string): string {
  let c = fallback;
  for (const z of zones) {
    if (value >= z.from && value <= z.to) c = z.color;
  }
  return c;
}

type Props = {
  value: number | null;
  defaultConfig: Record<string, unknown>;
};

export function NumericDisplayNodePanel({ value, defaultConfig }: Props) {
  const cfg = coerceConfig(defaultConfig);
  const hasValue = value != null && Number.isFinite(value);
  const valStr = hasValue ? (value as number).toFixed(cfg.decimals) : "—";
  const color = hasValue ? zoneColor(cfg.zones, value as number, "rgba(228,228,231,0.95)") : "rgba(82,82,91,0.8)";
  const barColor = hasValue ? zoneColor(cfg.zones, value as number, "rgba(63,63,70,0.6)") : "rgba(39,39,42,0.6)";

  return (
    <div className="nodrag flex flex-col gap-0 px-3 py-2">
      {cfg.label.length > 0 && (
        <span className="mb-0.5 text-[9px] font-medium uppercase tracking-widest text-zinc-500">
          {cfg.label}
        </span>
      )}

      <div className="flex items-baseline gap-1">
        <span
          className="font-mono text-xl font-bold tabular-nums leading-tight tracking-tight"
          style={{ color }}
        >
          {valStr}
        </span>
        {cfg.unit.length > 0 && (
          <span className="font-mono text-xs text-zinc-500">{cfg.unit}</span>
        )}
      </div>

      {cfg.showStatusBar && (
        <div
          className="mt-1.5 h-[3px] w-full rounded-full transition-colors duration-300"
          style={{ backgroundColor: barColor }}
        />
      )}
    </div>
  );
}
