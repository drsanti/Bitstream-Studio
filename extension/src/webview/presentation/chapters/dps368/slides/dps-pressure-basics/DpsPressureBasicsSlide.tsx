import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { BaroPressureSvg } from "../../../_shared/visual/diagrams/BaroPressureSvg";
export default function DpsPressureBasicsSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Foundations"
      title="Pressure fundamentals"
      subtitle="Barometric sensors report absolute pressure — not gauge pressure relative to the room."
      visualLabel="Altitude link"
      visual={<BaroPressureSvg />}
    >
      <div className="flex max-w-xl flex-col gap-3 text-sm text-[var(--text-secondary)]">
        <p>
          <span className="font-semibold text-[var(--text-primary)]">Sea level</span> is roughly 1013 hPa on a
          standard day; weather systems move that reference slowly.
        </p>
        <p>
          MEMS barometers measure the weight of the air column above the sensor — climb stairs and pressure drops.
        </p>
        <p>BS2 publishes pressure as hPa×10 in the DPS368 secondary field when the mask bit is set.</p>
      </div>
    </TheorySlideLayout>
  );
}
