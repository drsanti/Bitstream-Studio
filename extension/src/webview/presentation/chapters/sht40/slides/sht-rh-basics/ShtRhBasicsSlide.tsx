import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

export default function ShtRhBasicsSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Foundations"
      title="Relative humidity"
      subtitle="%RH is water vapor relative to saturation at the current temperature."
    >
      <div className="flex max-w-xl flex-col gap-3 text-sm text-[var(--text-secondary)]">
        <p>
          <span className="font-semibold text-[var(--text-primary)]">50 %RH</span> means the air holds half the
          moisture it could at that temperature — warm air can hold more absolute moisture than cold air.
        </p>
        <p>
          Dew point and condensation risk rise when RH approaches 100 % — important for storage and electronics
          enclosures.
        </p>
        <p>BS2 publishes humidity as %RH×100 in the SHT40 secondary field when the mask bit is set.</p>
      </div>
    </TheorySlideLayout>
  );
}
