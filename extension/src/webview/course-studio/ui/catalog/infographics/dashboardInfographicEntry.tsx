import {
  coerceInfographicVisualPreset,
  isActiveInfographicPreset,
} from "../../../schemas/infographicVisualPreset.v1";
import type { CourseBindingHealthStatus } from "../../../runtime/courseBindingHealth";
import { CourseInfographicWidget } from "./CourseInfographicWidget";

export function readDashboardVisualPreset(style: Record<string, unknown> | undefined) {
  return coerceInfographicVisualPreset(style?.visualPreset, "abstract");
}

export function tryRenderDashboardInfographic(args: {
  style: Record<string, unknown>;
  label: string;
  value: number | null;
  unit?: string;
  min: number;
  max: number;
  decimals: number;
  health?: CourseBindingHealthStatus;
  className?: string;
}) {
  const preset = readDashboardVisualPreset(args.style);
  if (!isActiveInfographicPreset(preset)) {
    return null;
  }

  const showLabel = args.style.showLabel !== false;
  const showValue = args.style.showValue !== false;
  const showUnit = args.style.showUnit !== false;

  return (
    <CourseInfographicWidget
      preset={preset}
      label={args.label}
      value={args.value}
      unit={args.unit}
      min={args.min}
      max={args.max}
      decimals={args.decimals}
      showLabel={showLabel}
      showValue={showValue}
      showUnit={showUnit}
      health={args.health}
      configSource={args.style}
      className={args.className}
    />
  );
}
