/** Large digital readout node panel — HTML/CSS. */

import {
  PRESENTATION_DARK_TEXT_LIVE_TRACK,
  PRESENTATION_DARK_TEXT_LIVE_VALUE,
  PRESENTATION_DARK_TEXT_META,
} from "../../../../../presentation/design/presentationTextColors";
import {
  coerceNumericDisplayConfig,
  gaugeStatusBarFillBackground,
  gaugeStatusBarFillRatio,
  gaugeZoneColor,
} from "../display/gauge-display-config";
import { gaugeCanvasHealthPanelClassName } from "../display/gauge-canvas-health";
import type { SensorHealthStatus } from "../../store/flow-editor.store";

type Props = {
  value: number | null;
  defaultConfig: Record<string, unknown>;
  sensorHealth?: SensorHealthStatus;
};

export function NumericDisplayNodePanel({ value, defaultConfig, sensorHealth }: Props) {
  const cfg = coerceNumericDisplayConfig(defaultConfig);
  const hasValue = value != null && Number.isFinite(value);
  const valStr = hasValue ? (value as number).toFixed(cfg.decimals) : "—";
  const liveValueColor = `var(--course-wb-value, var(--text-live-value, ${PRESENTATION_DARK_TEXT_LIVE_VALUE}))`;
  const color = hasValue
    ? gaugeZoneColor(cfg.zones, value as number, liveValueColor)
    : "rgba(82,82,91,0.8)";
  const statusBarFillRatio = hasValue
    ? gaugeStatusBarFillRatio(value as number, cfg.min, cfg.max)
    : 0;
  const statusBarFillBackground = gaugeStatusBarFillBackground(
    cfg.zones,
    hasValue ? (value as number) : null,
    { trackFallback: PRESENTATION_DARK_TEXT_LIVE_TRACK },
  );
  const metaTextColor = `var(--course-wb-label, var(--text-secondary, ${PRESENTATION_DARK_TEXT_META}))`;

  return (
    <div
      className={`nodrag flex flex-col gap-0 px-3 py-2 transition-opacity duration-300 ${gaugeCanvasHealthPanelClassName(sensorHealth) ?? ""}`}
    >
      {cfg.label.length > 0 && (
        <span
          className="mb-0.5 truncate text-[11px] font-medium leading-tight"
          style={{ color: metaTextColor }}
        >
          {cfg.label}
        </span>
      )}

      <div className="flex items-baseline gap-1">
        <span
          className="font-mono text-xl font-bold leading-tight tracking-tight"
          style={{ color }}
        >
          {valStr}
        </span>
        {cfg.unit.length > 0 && (
          <span className="font-mono text-xs" style={{ color: metaTextColor }}>
            {cfg.unit}
          </span>
        )}
      </div>

      {cfg.showStatusBar && (
        <div
          className="numeric-display-status-bar mt-1.5 h-[3px] w-full overflow-hidden rounded-full"
          style={{
            backgroundColor: "var(--course-wb-track-bg, rgba(255,255,255,0.08))",
          }}
        >
          <div
            className="numeric-display-status-bar__fill h-full rounded-full transition-[width,opacity] duration-300"
            style={{
              width: `${statusBarFillRatio * 100}%`,
              background: statusBarFillBackground,
              opacity: hasValue ? 0.95 : 0,
            }}
          />
        </div>
      )}
    </div>
  );
}
