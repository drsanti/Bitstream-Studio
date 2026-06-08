import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

const SPECS = [
  ["Sensor", "Sensirion SHT40"],
  ["Outputs", "Temperature (°C) + %RH"],
  ["Interface", "I²C"],
  ["BS2 id", "sensorId 2"],
];

export default function ShtProductOverviewSlide() {
  return (
    <TheorySlideLayout eyebrow="Product" title="SHT40 overview" subtitle="High-accuracy RH/T in a small package.">
      <div className="grid max-w-2xl grid-cols-1 gap-2">
        {SPECS.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3"
          >
            <span className="text-sm text-[var(--text-muted)]">{k}</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{v}</span>
          </div>
        ))}
      </div>
    </TheorySlideLayout>
  );
}
