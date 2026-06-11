import { useId } from "react";
import type { InfographicSkinConfig } from "../../infographicVisualPreset";
import type { WidgetBoardReadoutLayoutConfig } from "../../../widget-board/widgetBoardReadoutLayout";
import {
  INFOGRAPHIC_TOP_RIGHT_READOUT,
  resolveInfographicFillGradientStops,
} from "../../infographicFillStyle";
import { formatInfographicValue } from "../../infographicGeometry";
import { InfographicReadoutPanel } from "../../InfographicReadoutPanel";

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
  readoutConfig = {},
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
  readoutConfig?: WidgetBoardReadoutLayoutConfig;
}) {
  const fillPercent = Math.max(0, Math.min(100, ratio * 100));
  const gradientStops = resolveInfographicFillGradientStops(config, "droplet-fill");
  const clipId = useId().replace(/:/g, "");
  const gradId = `${clipId}-grad`;
  const emptyInterior = "rgba(255,255,255,0.06)";

  return (
    <div
      className="course-infographic-droplet flex h-full min-h-0 w-full flex-col items-stretch gap-1 px-2 py-2"
      data-infographic-skin="droplet-fill"
    >
      <InfographicReadoutPanel
        config={{ ...INFOGRAPHIC_TOP_RIGHT_READOUT, ...readoutConfig }}
        showLabel={showLabel}
        showValue={showValue}
        label={label}
        value={
          <>
            {formatInfographicValue(value, decimals)}
            {showUnit && unit ? (
              <span className="ml-1 text-[10px] font-semibold text-[var(--course-wb-unit)]">{unit}</span>
            ) : null}
          </>
        }
        stackClassName="w-full"
      />
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <svg viewBox="0 0 48 64" className="h-full max-h-full w-auto" aria-hidden>
          <defs>
            <clipPath id={clipId}>
              <path d="M24 4 C24 4 8 28 8 40 a16 16 0 0 0 32 0 C40 28 24 4 24 4 Z" />
            </clipPath>
            <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={gradientStops.from} />
              {gradientStops.mid != null ? (
                <stop offset="50%" stopColor={gradientStops.mid} />
              ) : null}
              <stop offset="100%" stopColor={gradientStops.to} />
            </linearGradient>
          </defs>
          <path
            d="M24 4 C24 4 8 28 8 40 a16 16 0 0 0 32 0 C40 28 24 4 24 4 Z"
            fill={emptyInterior}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.2"
          />
          <g clipPath={`url(#${clipId})`}>
            <rect x="0" y="0" width="48" height="64" fill={`url(#${gradId})`} />
            <rect
              x="0"
              y="0"
              width="48"
              height={(64 * (100 - fillPercent)) / 100}
              fill={emptyInterior}
              className="transition-[height] duration-200"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
