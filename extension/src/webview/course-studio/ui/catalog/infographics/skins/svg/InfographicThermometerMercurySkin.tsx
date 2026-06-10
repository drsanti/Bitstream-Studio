import type { InfographicSkinConfig } from "../../infographicVisualPreset";
import { formatInfographicValue } from "../../infographicGeometry";

export function InfographicThermometerMercurySkin({
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
  const tubeW = config.tubeWidthPercent;
  const bulb = config.bulbSizePercent;
  const fill = config.fillColor ?? "var(--course-wb-gradient-from, #f87171)";
  const track = config.trackColor ?? "var(--course-wb-track-bg, rgba(255,255,255,0.1))";

  return (
    <div
      className="course-infographic-thermometer flex h-full min-h-0 w-full items-center justify-center gap-2 px-2 py-2"
      data-infographic-skin="thermometer-mercury"
    >
      <div className="relative flex h-full min-h-0 flex-col items-center justify-end" style={{ width: `${tubeW}%` }}>
        <div
          className="relative min-h-0 w-full flex-1 overflow-hidden rounded-t-full rounded-b-md border border-white/10"
          style={{ backgroundColor: track }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-sm transition-[height] duration-200"
            style={{ height: `${fillPercent}%`, background: fill }}
          />
        </div>
        <div
          className="mt-0.5 shrink-0 rounded-full border border-white/10"
          style={{
            width: `${bulb}%`,
            aspectRatio: "1",
            background: fill,
            boxShadow: `0 0 10px color-mix(in srgb, ${fill} 45%, transparent)`,
          }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {showLabel ? (
          <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--course-wb-label)]">
            {label}
          </p>
        ) : null}
        {showValue ? (
          <p className="mt-0.5 text-[16px] font-bold leading-tight text-[var(--course-wb-value)]">
            {formatInfographicValue(value, decimals)}
            {showUnit && unit ? (
              <span className="ml-1 text-[11px] font-semibold text-[var(--course-wb-unit)]">{unit}</span>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
