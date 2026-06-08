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
      value: "audio-machine-rpm",
      label: "Audio machine RPM",
      hint: "Ramp (0→1) → Audio Machine.Speed → Audio Scope + Audio Output (wired Audio bus). Enable the output engine to hear EV motor whine rise with the ramp.",
    },
    {
      value: "audio-machine-map-range",
      label: "Audio machine (Map Range)",
      hint: "Sine (−1..1) → Map Range (0..1) → Industrial Audio Machine.Speed → Scope + Output. Wire Threshold → Trigger for press clanks.",
    },
    {
      value: "audio-machine-fault-lab",
      label: "Audio machine fault lab",
      hint: "Sine → Map Range → Machine.Speed; Threshold (>0.88) → Machine.Trigger + SFX beep. Press preset clanks on peaks; enable Audio Output to listen.",
    },
    {
      value: "camera-video-texture",
      label: "Camera video texture",
      hint: "Camera Input → Video Texture + Vision Pose (wired Video bus). Enable the camera node and allow browser permission; pose outputs update when MediaPipe model loads.",
    },
    {
      value: "dashboard-button-led",
      label: "Dashboard + button",
      hint: "Sine → **Dashboard Text**; **Dashboard Button** → Set Boolean → **Dashboard LED**; all widgets wired to **Dashboard Output**. Open the **Dashboard** workbench pane (or **Dashboard focus** layout preset).",
    },
    {
      value: "dashboard-controls-demo",
      label: "Dashboard controls",
      hint: "Full operator starter — **Switch**, **Slider**, text, gauge, button/LED, and published **Compare** status pill. Open **Dashboard** → **Edit** to drag grid placement and resize spans.",
    },
    {
      value: "dashboard-publish-demo",
      label: "Dashboard publish",
      hint: "Sine → **Radial Gauge** + **Numeric Display** + **LED** with **Show on Dashboard** enabled (no Widget wires). Add **Dashboard Output** only — open **Dashboard** or **Operator** layout to preview.",
    },
    {
      value: "dashboard-tabs-demo",
      label: "Dashboard tabs",
      hint: "Two **Dashboard Tab** pages wired to **Tabs** on **Dashboard Output** — **Overview** (button + text) and **Trends** (published sparkline). Open **Dashboard** pane to switch tabs.",
    },
    {
      value: "stage-scene-output",
      label: "Stage + Scene Output",
      hint: "Model Source (PSoC E84 pack model) → **Scene Output** (+ optional **Environment**). Open the **Stage** workbench pane to preview the full viewport; use **Model Viewer** separately for in-graph authoring.",
    },
    {
      value: "primitives-playground",
      label: "Primitives playground",
      hint: "Mesh materials + **Mesh Plane** floor + two **Mesh Sphere** nodes → Scene Output **Meshes** (+ **Environment**). Open **Stage** — no GLB required.",
    },
    {
      value: "stage-camera-vision",
      label: "Stage camera + vision",
      hint: "Stage + Scene Output with **Camera Input**, screen **CSS3D Camera Feed**, and **Vision Pose**. Open **Stage** for the 3D view; vision status chips appear top-right when inference runs.",
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
      value: "animation-clip-blend",
      label: "Animation clip blend",
      hint: "Model Source → **Model Viewer** with two **Animation Clip** nodes → **Animation Blend** (Sine → Map Range drives **Factor**). Clips auto-bind from the pack GLB when it exposes animations.",
    },
    {
      value: "animation-mix-demo",
      label: "Animation mix demo",
      hint: "Model Source (**TESA drone**) → three **Animation Clip** nodes → **Animation Mix** → **Model Viewer**. Sine → Map Range drives the first mix weight socket (**wa**); clips auto-bind when the GLB loads.",
    },
    {
      value: "part-spin-demo",
      label: "Part spin demo",
      hint: "Model Source (**TESA drone**) → **Model Viewer** with two **Part Spin** nodes (auto-bind first rotor parts). Sine → Map Range → spin A speed.",
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
