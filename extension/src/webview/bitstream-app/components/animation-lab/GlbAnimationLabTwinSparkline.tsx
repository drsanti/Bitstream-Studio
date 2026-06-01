import { useMemo } from "react";
import { buildSparklinePolylinePoints } from "../../../sensor-studio/features/editor/nodes/display/sparkline-display-config.js";
import { ANIMATION_LAB_TWIN_TREND_MAX_SAMPLES } from "./animation-lab-twin-trends.js";

export function GlbAnimationLabTwinSparkline(props: {
  samples: readonly number[];
  className?: string;
  strokeColor?: string;
}) {
  const points = useMemo(
    () =>
      buildSparklinePolylinePoints(props.samples, ANIMATION_LAB_TWIN_TREND_MAX_SAMPLES),
    [props.samples],
  );

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={props.className ?? "block h-8 w-full min-w-0 shrink-0"}
      aria-hidden
    >
      {points.length > 0 ? (
        <polyline
          fill="none"
          stroke={props.strokeColor ?? "#22d3ee"}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="nonScalingStroke"
          points={points}
        />
      ) : (
        <line
          x1={0}
          y1={50}
          x2={100}
          y2={50}
          stroke="#52525b"
          strokeWidth={1}
          vectorEffect="nonScalingStroke"
        />
      )}
    </svg>
  );
}
