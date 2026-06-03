import { useMemo } from "react";
import { gaugeCanvasHealthPanelClassName } from "../display/gauge-canvas-health";
import {
  buildSparklinePolylinePoints,
  coerceSparklineConfig,
} from "../display/sparkline-display-config";
import type { SensorHealthStatus } from "../../store/flow-editor.store";

type Props = {
  className?: string;
  history: readonly number[];
  defaultConfig: Record<string, unknown>;
  sensorHealth?: SensorHealthStatus;
};

export function SparklineNodePanel({
  className,
  history,
  defaultConfig,
  sensorHealth,
}: Props) {
  const cfg = useMemo(() => coerceSparklineConfig(defaultConfig), [defaultConfig]);
  const points = useMemo(
    () => buildSparklinePolylinePoints(history, cfg.historySize),
    [cfg.historySize, history],
  );
  const healthClass = gaugeCanvasHealthPanelClassName(sensorHealth);

  return (
    <div
      className={`flex min-h-0 w-full max-w-full flex-col p-1 transition-opacity duration-300 ${healthClass ?? ""} ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="block h-10 w-full min-h-10 min-w-0 max-w-full shrink-0"
        aria-hidden
      >
        {points.length > 0 ? (
          <polyline
            fill="none"
            stroke={cfg.strokeColor}
            strokeWidth={cfg.strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="nonScalingStroke"
            points={points}
          />
        ) : null}
      </svg>
    </div>
  );
}
