import {
  coerceDashboardFormatFallback,
  coerceDashboardFormatTemplate,
  formatDashboardNumericTemplate,
} from "../../core/dashboard/dashboard-format-template";
import { gaugeCanvasHealthPanelClassName } from "../editor/nodes/display/gauge-canvas-health";
import type { SensorHealthStatus } from "../editor/store/flow-editor.store";

type Props = {
  value: number | null;
  defaultConfig: Record<string, unknown>;
  sensorHealth?: SensorHealthStatus;
};

export function DashboardFormattedTextPanel({ value, defaultConfig, sensorHealth }: Props) {
  const template = coerceDashboardFormatTemplate(defaultConfig.template);
  const fallback = coerceDashboardFormatFallback(defaultConfig.fallback);
  const unit = typeof defaultConfig.unit === "string" ? defaultConfig.unit : "";
  const decimals =
    typeof defaultConfig.decimals === "number" && Number.isFinite(defaultConfig.decimals)
      ? defaultConfig.decimals
      : 1;
  const label = typeof defaultConfig.label === "string" ? defaultConfig.label.trim() : "";

  const text = formatDashboardNumericTemplate({
    template,
    value,
    unit,
    decimals,
    fallback,
  });

  return (
    <div
      className={`nodrag flex min-h-[var(--dashboard-row-height,48px)] flex-col justify-center gap-0.5 px-3 py-2 transition-opacity duration-300 ${gaugeCanvasHealthPanelClassName(sensorHealth) ?? ""}`}
    >
      {label.length > 0 ? (
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </span>
      ) : null}
      <span className="truncate text-[13px] font-medium leading-snug text-zinc-100">{text}</span>
    </div>
  );
}
