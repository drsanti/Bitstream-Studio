import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

const SPECS = [
  ["Interface", "I²C / SPI"],
  ["Field range", "±2000 µT typical use"],
  ["ODR", "Up to 400 Hz (config-dependent)"],
  ["Extra", "On-chip temperature channel"],
  ["BS2 id", "sensorId 1"],
];

export default function BmmProductOverviewSlide() {
  return (
    <TheorySlideLayout eyebrow="Product" title="BMM350 overview" subtitle="Datasheet snapshot for instructors.">
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
