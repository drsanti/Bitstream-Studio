import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

const SPECS = [
  ["Range", "300–1200 hPa typical"],
  ["Resolution", "High-precision MEMS baro"],
  ["Extra", "Temperature channel"],
  ["BS2 id", "sensorId 3"],
];

export default function DpsProductOverviewSlide() {
  return (
    <TheorySlideLayout eyebrow="Product" title="DPS368 overview" subtitle="Datasheet-level snapshot.">
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
