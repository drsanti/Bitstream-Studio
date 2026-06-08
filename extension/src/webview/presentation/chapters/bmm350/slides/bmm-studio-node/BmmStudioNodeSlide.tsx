import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { SensorStudioNodeSvg } from "../../../_shared/visual/diagrams/SensorStudioNodeSvg";

export default function BmmStudioNodeSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Sensor Studio"
      title="BMM350 flow node"
      subtitle="Magnetic vector and temperature on one live node — tap nodes for single outputs."
      visualLabel="Node outputs"
      visualAccent="green"
      visual={
        <SensorStudioNodeSvg
          title="BMM350"
          ports={["Magnetic (µT) — vector3", "Temperature (°C) — number", "Samples — number"]}
          accent="var(--accent-green)"
        />
      }
    >
      <p className="max-w-xl text-sm text-[var(--text-secondary)]">
        Use <span className="font-semibold text-[var(--text-primary)]">Magnetic</span> tap for compass widgets;
        <span className="font-semibold text-[var(--text-primary)]"> Temperature</span> tap for die temp plots. Same{" "}
        <span className="text-[var(--accent-cyan)]">latestByHint.bmm350</span> store path as this presentation deck.
      </p>
    </TheorySlideLayout>
  );
}
