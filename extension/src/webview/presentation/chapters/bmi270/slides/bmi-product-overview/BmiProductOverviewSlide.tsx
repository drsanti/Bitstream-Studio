import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

const SPECS = [
  ["Interface", "I²C / SPI"],
  ["Accel FS", "±2 / 4 / 8 / 16 g"],
  ["Gyro FS", "±125 … ±2000 °/s"],
  ["Typical ODR", "Up to 6.4 kHz (sensor-dependent)"],
  ["On-chip", "Step counter, activity, FIFO, interrupts"],
];

export default function BmiProductOverviewSlide() {
  return (
    <TheorySlideLayout eyebrow="Product" title="BMI270 overview" subtitle="Datasheet-level facts for instructors — not a register tutorial.">
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
