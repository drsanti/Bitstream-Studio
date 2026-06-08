import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

export default function DpsAltitudeSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Foundations"
      title="Pressure ↔ altitude"
      subtitle="Barometric formula (simplified ISA) — teaching estimate, not survey-grade GPS."
    >
      <div className="flex max-w-xl flex-col gap-4 text-sm text-[var(--text-secondary)]">
        <p className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 text-[var(--accent-cyan)]">
          h ≈ 44330 × (1 − (P / P₀)^(1/5.255)) meters
        </p>
        <p>
          <span className="font-semibold text-[var(--text-primary)]">P₀</span> is your reference pressure at
          “ground” — set once when you start a climb demo; weather drift affects absolute altitude unless recalibrated.
        </p>
        <p>The live altitude demo slide uses P₀ = 1013.25 hPa by default — adjust in Sensor Telemetry if needed.</p>
      </div>
    </TheorySlideLayout>
  );
}
