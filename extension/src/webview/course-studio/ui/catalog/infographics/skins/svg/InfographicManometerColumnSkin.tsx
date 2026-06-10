import type { InfographicSkinConfig } from "../../infographicVisualPreset";
import { formatInfographicValue } from "../../infographicGeometry";

export function InfographicManometerColumnSkin({
  label,
  value,
  unit,
  decimals,
  ratio,
  showLabel,
  showValue,
  showUnit,
  config,
}: {
  label: string;
  value: number | null;
  unit?: string;
  decimals: number;
  ratio: number;
  showLabel: boolean;
  showValue: boolean;
  showUnit: boolean;
  config: InfographicSkinConfig;
}) {
  const fillPercent = Math.max(0, Math.min(100, ratio * 100));
  const trackW = config.trackWidthPercent;
  const fill = config.fillColor ?? "var(--course-wb-gradient-from, #38bdf8)";
  const track = config.trackColor ?? "var(--course-wb-track-bg, rgba(255,255,255,0.08))";

  return (
    <div
      className="course-infographic-manometer flex h-full min-h-0 w-full gap-2 px-2 py-2"
      data-infographic-skin="manometer-column"
    >
      <div
        className="relative min-h-0 shrink-0 overflow-hidden rounded-md border border-white/10"
        style={{ width: `${trackW}%`, backgroundColor: track }}
      >
        <span
          className="absolute bottom-0 left-0 right-0 transition-[height] duration-200"
          style={{
            height: `${fillPercent}%`,
            background: `linear-gradient(180deg, ${fill}, color-mix(in srgb, ${fill} 70%, #08111e))`,
          }}
        />
        {config.showScaleTicks ? (
          <div className="pointer-events-none absolute inset-y-2 right-0.5 flex flex-col justify-between">
            {[100, 75, 50, 25, 0].map((tick) => (
              <span key={tick} className="h-px w-1.5 bg-white/20" />
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {showLabel ? (
          <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--course-wb-label)]">
            {label}
          </p>
        ) : null}
        {showValue ? (
          <p className="mt-0.5 text-[15px] font-bold leading-tight text-[var(--course-wb-value)]">
            {formatInfographicValue(value, decimals)}
            {showUnit && unit ? (
              <span className="ml-1 text-[10px] font-semibold text-[var(--course-wb-unit)]">{unit}</span>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
