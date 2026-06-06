import type { StudioDemoTemplateId } from "../../store/flow-editor.store";

export type CanvasDemoTemplateOption = {
  value: StudioDemoTemplateId;
  label: string;
  hint: string;
};

/** Built-in flow presets (same ids as `runDemoTemplate`). */
export const CANVAS_DEMO_TEMPLATE_OPTIONS: readonly CanvasDemoTemplateOption[] =
  [
    {
      value: "audio-oscillator-tone",
      label: "Audio oscillator tone",
      hint: "Oscillator → Audio Scope + Audio Output (wired Audio bus). Sweep 220–880 Hz is on by default. Enable the output engine, then toggle Gate for a safe test tone.",
    },
    {
      value: "audio-lab",
      label: "Audio lab",
      hint: "Microphone → Plotter (RMS/Peak/Centroid) + Audio Scope + Audio Output (wired Audio bus). Enable mic and the output engine, then use Gate/Gain to listen safely.",
    },
    {
      value: "audio-file-playback",
      label: "Audio file playback",
      hint: "Audio File Player → Audio Scope + Audio Output (wired Audio bus) + Plotter (time/duration). Paste a URL, enable the output engine, then Play.",
    },
    {
      value: "stage-scene-output",
      label: "Stage + Scene Output",
      hint: "Model Source (PSoC E84 pack model) → **Scene Output** (+ optional **Environment**). Open the **Stage** workbench pane to preview the full viewport; use **Model Viewer** separately for in-graph authoring.",
    },
    {
      value: "material-glb-drives",
      label: "Material drives",
      hint: "Model Source (PSoC E84 pack model) → **Model Viewer** + linked **Material Property** (roughness slider) and **Material Texture** (sample bridge face on **map**). Re-bind material names via Library **Model → Materials** if your model uses different refs.",
    },
    {
      value: "rotation-glb-anim",
      label: "Rotation + animation",
      hint: "BMI270 Euler → 3D Rotation with **Animation Clips** + **On Click → Play Animation** (pack default model). Bind a clip on the trigger/bundle, then click empty canvas to fire.",
    },
    {
      value: "signal-chain",
      label: "Signal chain",
      hint: "Sensor Input → Low pass → Threshold → Indicator + Bar meter + Sparkline — good default for live telemetry demos.",
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
      value: "vector-magnitude",
      label: "Vector magnitude",
      hint: "Vector (3, 4, 0) → Vector Length → bar meter (expects 5). No hardware required.",
    },
    {
      value: "bmi270-gauge-z",
      label: "BMI270 gauge (Z)",
      hint: "Accelerometer Z axis into a gauge node.",
    },
  ] as const;
