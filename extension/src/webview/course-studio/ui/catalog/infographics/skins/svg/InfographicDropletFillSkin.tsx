import type { InfographicSkinConfig } from "../../infographicVisualPreset";
import { formatInfographicValue } from "../../infographicGeometry";

export function InfographicDropletFillSkin({
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
  const fill = config.fillColor ?? "var(--course-wb-gradient-to, #38bdf8)";
  const clipId = "course-infographic-droplet-clip";

  return (
    <div
      className="course-infographic-droplet flex h-full min-h-0 w-full flex-col items-center justify-center gap-1 px-2 py-2"
      data-infographic-skin="droplet-fill"
    >
      {showLabel ? (
        <p className="truncate text-[10px] font-medium uppercase tracking-widest text-[var(--course-wb-label)]">
          {label}
        </p>
      ) : null}
      <svg viewBox="0 0 48 64" className="h-full max-h-[70%] w-auto" aria-hidden>
        <defs>
          <clipPath id={clipId}>
            <path d="M24 4 C24 4 8 28 8 40 a16 16 0 0 0 32 0 C40 28 24 4 24 4 Z" />
          </clipPath>
        </defs>
        <path
          d="M24 4 C24 4 8 28 8 40 a16 16 0 0 0 32 0 C40 28 24 4 24 4 Z"
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.2"
        />
        <g clipPath={`url(#${clipId})`}>
          <rect
            x="0"
            y={64 - (56 * fillPercent) / 100}
            width="48"
            height="56"
            fill={fill}
            className="transition-[y] duration-200"
          />
        </g>
      </svg>
      {showValue ? (
        <p className="text-[13px] font-bold text-[var(--course-wb-value)]">
          {formatInfographicValue(value, decimals)}
          {showUnit && unit ? (
            <span className="ml-1 text-[10px] font-semibold text-[var(--course-wb-unit)]">{unit}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
