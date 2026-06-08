import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { SensorStudioNodeSvg } from "../../../_shared/visual/diagrams/SensorStudioNodeSvg";

const PORTS = [
  "Accel (m/s²) — vector3",
  "Gyro (rad/s) — vector3",
  "Euler (rad) — vector3",
  "Quaternion — quaternion",
  "Temperature (°C) — number",
  "Samples — number",
];

const TAPS = [
  "Quaternion · Euler · Acceleration · Gyroscope · Temperature · Samples",
];

export default function BmiStudioNodeSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Sensor Studio"
      title="BMI270 flow node"
      subtitle="One live stream powers the full node or lightweight tap nodes for single outputs."
      visualLabel="Node outputs"
      visualAccent="amber"
      visual={<SensorStudioNodeSvg title="BMI270" ports={PORTS} accent="var(--accent-amber)" />}
      footer="Open Sensor Studio → Flow → add BMI270 or a tap node; wire to Dashboard gauges or Stage."
    >
      <div className="flex max-w-xl flex-col gap-3 text-sm text-[var(--text-secondary)]">
        <p>
          The <span className="font-semibold text-[var(--text-primary)]">BMI270</span> node mirrors decoded BS2
          fields. Tap nodes expose one port each — useful when a flow only needs quaternion or accel.
        </p>
        <p>
          <span className="font-semibold text-[var(--text-primary)]">Tap nodes:</span> {TAPS[0]}.
        </p>
        <p>
          Presentation and Sensor Studio share <span className="text-[var(--accent-cyan)]">useBitstreamLiveStore</span>{" "}
          — no second decoder in the deck.
        </p>
      </div>
    </TheorySlideLayout>
  );
}
