/** Large digital readout node panel — HTML/CSS. */

import {
  coerceNumericDisplayConfig,
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
  const color = hasValue
    ? gaugeZoneColor(cfg.zones, value as number, "rgba(228,228,231,0.95)")
    : "rgba(82,82,91,0.8)";
  const barColor = hasValue
    ? gaugeZoneColor(cfg.zones, value as number, "rgba(63,63,70,0.6)")
    : "rgba(39,39,42,0.6)";

  return (
    <div
      className={`nodrag flex flex-col gap-0 px-3 py-2 transition-opacity duration-300 ${gaugeCanvasHealthPanelClassName(sensorHealth) ?? ""}`}
    >
      {cfg.label.length > 0 && (
        <span className="mb-0.5 text-[9px] font-medium uppercase tracking-widest text-zinc-500">
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
