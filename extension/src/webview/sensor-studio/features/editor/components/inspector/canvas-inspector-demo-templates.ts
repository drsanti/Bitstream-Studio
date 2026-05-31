import type { StudioDemoTemplateId } from "../../store/flow-editor.store";

export type CanvasDemoTemplateOption = {
  value: StudioDemoTemplateId;
  label: string;
  hint: string;
};

/** Built-in flow presets (same ids as `runDemoTemplate`). */
export const CANVAS_DEMO_TEMPLATE_OPTIONS: readonly CanvasDemoTemplateOption[] = [
  {
    value: "signal-chain",
    label: "Signal chain",
    hint: "BMI270 tap → threshold → gauge — good default for live telemetry demos.",
  },
  {
    value: "basic-indicator",
    label: "Basic indicator",
    hint: "Minimal LED indicator wired to a scalar tap.",
  },
  {
    value: "gauge-monitor",
    label: "Gauge monitor",
    hint: "Gauge + numeric display for a single sensor channel.",
  },
  {
    value: "bmi270-gauge-z",
    label: "BMI270 gauge (Z)",
    hint: "Accelerometer Z axis into a gauge node.",
  },
] as const;
