import { useId } from "react";
import type { InfographicSkinConfig } from "../../infographicVisualPreset";
import type { WidgetBoardReadoutLayoutConfig } from "../../../widget-board/widgetBoardReadoutLayout";
import {
  INFOGRAPHIC_TOP_RIGHT_READOUT,
  resolveInfographicFillGradientStops,
} from "../../infographicFillStyle";
import { formatInfographicValue } from "../../infographicGeometry";
import { InfographicReadoutPanel } from "../../InfographicReadoutPanel";

const PAD_TOP = 8;
const PAD_BOTTOM = 6;
const PAD_X = 4;

const STEM = { x: 15, y: 6, w: 26, h: 62, rx: 13 };
const BULB = { cx: 28, cy: 92, r: 22 };

const CONTENT_LEFT = BULB.cx - BULB.r;
const CONTENT_W = BULB.r * 2;
const VIEW_H = BULB.cy + BULB.r + PAD_BOTTOM;
const VIEW_BOX = `${CONTENT_LEFT - PAD_X} ${-PAD_TOP} ${CONTENT_W + PAD_X * 2} ${VIEW_H + PAD_TOP}`;

const MERCURY_TOP = STEM.y;
const MERCURY_BOTTOM = BULB.cy + BULB.r;
const MERCURY_SPAN = MERCURY_BOTTOM - MERCURY_TOP;

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
  const gradientStops = resolveInfographicFillGradientStops(config, "thermometer-mercury");
  const trackFill = config.trackColor ?? "rgba(255,255,255,0.07)";
  const uid = useId().replace(/:/g, "");
  const mercuryClipId = `${uid}-mercury`;
  const fillClipId = `${uid}-fill`;
  const mercuryGradId = `${uid}-mercury-grad`;

  const fillTopY = MERCURY_BOTTOM - (MERCURY_SPAN * fillPercent) / 100;
  const fillHeight = MERCURY_BOTTOM - fillTopY;

  return (
    <div
      className="course-infographic-thermometer flex h-full min-h-0 w-full flex-col items-stretch gap-1 px-2 py-2"
      data-infographic-skin="thermometer-mercury"
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
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-visible">
        <svg
          viewBox={VIEW_BOX}
          className="block max-h-full max-w-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
          role="img"
        >
          <defs>
            <clipPath id={mercuryClipId}>
              <rect x={STEM.x} y={STEM.y} width={STEM.w} height={STEM.h} rx={STEM.rx} />
              <circle cx={BULB.cx} cy={BULB.cy} r={BULB.r} />
            </clipPath>
            <clipPath id={fillClipId}>
              <rect
                x={CONTENT_LEFT - PAD_X}
                y={fillTopY}
                width={CONTENT_W + PAD_X * 2}
                height={fillHeight}
              />
            </clipPath>
            <linearGradient id={mercuryGradId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={gradientStops.from} />
              {gradientStops.mid != null ? (
                <stop offset="50%" stopColor={gradientStops.mid} />
              ) : null}
              <stop offset="100%" stopColor={gradientStops.to} />
            </linearGradient>
          </defs>

          {/* Full silhouette — keeps rounded cap visible when fill is partial */}
          <rect
            x={STEM.x}
            y={STEM.y}
            width={STEM.w}
            height={STEM.h}
            rx={STEM.rx}
            fill={trackFill}
          />
          <circle cx={BULB.cx} cy={BULB.cy} r={BULB.r} fill={trackFill} />

          {fillPercent > 0 ? (
            <g clipPath={`url(#${mercuryClipId})`}>
              <g clipPath={`url(#${fillClipId})`}>
                <rect
                  x={CONTENT_LEFT - PAD_X}
                  y={-PAD_TOP}
                  width={CONTENT_W + PAD_X * 2}
                  height={VIEW_H + PAD_TOP}
                  fill={`url(#${mercuryGradId})`}
                />
              </g>
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  );
}
