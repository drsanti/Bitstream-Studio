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
      hint: "Oscillator → Audio Output + Audio Scope. Enable output engine, then toggle Gate to hear a safe 440 Hz test tone.",
    },
    {
      value: "audio-lab",
      label: "Audio lab",
      hint: "Microphone → Plotter (RMS/Peak/Centroid) + Audio Scope + Audio Output monitoring. Enable mic and audio output, then use Gate/Gain to listen safely.",
    },
    {
      value: "audio-file-playback",
      label: "Audio file playback",
      hint: "Audio File Player → Audio Output + Audio Scope + Plotter (time/duration). Paste a URL, enable output engine, then Play.",
    },
    {
      value: "material-glb-drives",
      label: "Material GLB drives",
      hint: "Studio Model (robot) → **Model Viewer** + linked **GLB Material Param** (roughness slider) and **GLB Material Texture** (sample bridge face on **map**). Re-bind material names via Library **GLB → Materials** if your GLB uses different refs.",
    },
    {
      value: "rotation-glb-anim",
      label: "Rotation + GLB anim",
      hint: "BMI270 Euler → 3D Rotation with **Animation** bundle + **On Click → Trigger GLB Anim** (robot GLB). Bind a clip on the trigger/bundle, then click empty canvas to fire.",
    },
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
