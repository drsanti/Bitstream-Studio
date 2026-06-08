import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { SensorStudioNodeSvg } from "../../../_shared/visual/diagrams/SensorStudioNodeSvg";

export default function DpsStudioNodeSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Sensor Studio"
      title="DPS368 flow node"
      subtitle="Pressure and temperature on one node — Pressure tap for dashboard gauges."
      visualLabel="Node outputs"
      visualAccent="cyan"
      visual={
        <SensorStudioNodeSvg
          title="DPS368"
          ports={["Pressure (hPa) — number", "Temperature (°C) — number", "Samples — number"]}
          accent="var(--accent-cyan)"
        />
      }
    >
      <p className="max-w-xl text-sm text-[var(--text-secondary)]">
        Wire <span className="font-semibold text-[var(--text-primary)]">Pressure</span> to Dashboard bar meters or
        Stage environment modulation. Pair with SHT40 humidity in multi-sensor labs later.
      </p>
    </TheorySlideLayout>
  );
}
