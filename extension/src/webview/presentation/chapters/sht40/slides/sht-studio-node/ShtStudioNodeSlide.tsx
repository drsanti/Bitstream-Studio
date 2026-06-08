import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { SensorStudioNodeSvg } from "../../../_shared/visual/diagrams/SensorStudioNodeSvg";

export default function ShtStudioNodeSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Sensor Studio"
      title="SHT40 flow node"
      subtitle="Humidity and temperature on one node — Humidity tap for dashboard gauges."
      visualLabel="Node outputs"
      visualAccent="cyan"
      visual={
        <SensorStudioNodeSvg
          title="SHT40"
          ports={["Humidity (%RH) — number", "Temperature (°C) — number", "Samples — number"]}
          accent="var(--accent-cyan)"
        />
      }
    >
      <p className="max-w-xl text-sm text-[var(--text-secondary)]">
        Pair with DPS368 pressure in Dashboard layouts for a compact environmental panel — same live store as this
        presentation deck.
      </p>
    </TheorySlideLayout>
  );
}
