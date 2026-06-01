/** LED indicator node panel — HTML/CSS (no canvas needed). */

import {
  coerceLedIndicatorConfig,
  ledIndicatorIsOn,
} from "../display/led-indicator-config";
import { gaugeCanvasHealthPanelClassName } from "../display/gauge-canvas-health";
import type { SensorHealthStatus } from "../../store/flow-editor.store";

type Props = {
  value: number | boolean | string | null | undefined;
  defaultConfig: Record<string, unknown>;
  sensorHealth?: SensorHealthStatus;
};

export function LedIndicatorNodePanel({ value, defaultConfig, sensorHealth }: Props) {
  const cfg = coerceLedIndicatorConfig(defaultConfig);
  const on = ledIndicatorIsOn(value, cfg.threshold);
  const healthClass = gaugeCanvasHealthPanelClassName(sensorHealth);

  return (
    <div
      className={`nodrag flex items-center gap-2.5 px-3 py-2.5 transition-opacity duration-300 ${healthClass ?? ""}`}
    >
      <div className="relative shrink-0">
        {on && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `0 0 10px 4px ${cfg.onColor}55`,
              borderRadius: "50%",
            }}
          />
        )}
        <div
          className={`relative h-5 w-5 rounded-full border transition-all duration-150 ${
            cfg.blink && on ? "animate-pulse" : ""
          }`}
          style={{
            backgroundColor: on ? cfg.onColor : cfg.offColor,
            borderColor: on ? cfg.onColor + "88" : "rgba(63,63,70,0.8)",
            boxShadow: on
              ? `0 0 6px 2px ${cfg.onColor}66, inset 0 1px 3px rgba(255,255,255,0.25)`
              : "inset 0 1px 2px rgba(0,0,0,0.4)",
          }}
        >
          {on && (
            <div
              className="absolute rounded-full"
              style={{
                top: "15%",
                left: "18%",
                width: "30%",
                height: "28%",
                background: "rgba(255,255,255,0.55)",
                filter: "blur(1px)",
              }}
            />
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        {cfg.label.length > 0 && (
          <span className="truncate text-[9px] font-medium uppercase tracking-widest text-zinc-500">
            {cfg.label}
          </span>
        )}
        <span
          className="text-xs font-semibold transition-colors duration-150"
          style={{ color: on ? cfg.onColor : "rgba(113,113,122,0.9)" }}
        >
          {on ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}
