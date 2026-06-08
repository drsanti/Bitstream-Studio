import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { ComfortZoneSvg } from "../../../_shared/visual/diagrams/ComfortZoneSvg";

export default function ShtComfortSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Foundations"
      title="Comfort zone"
      subtitle="Simplified ASHRAE-style band — teaching chart, not a building code."
      visualLabel="T × RH"
      visualAccent="cyan"
      visual={<ComfortZoneSvg tempC={23} rhPct={48} showMarker />}
    >
      <div className="flex max-w-xl flex-col gap-3 text-sm text-[var(--text-secondary)]">
        <p>Human comfort depends on both temperature and humidity — not either alone.</p>
        <p>
          The live demo classifies samples into{" "}
          <span className="text-[var(--text-primary)]">Comfortable / Too humid / Too dry / Too warm / Too cool</span>{" "}
          using simple thresholds for classroom discussion.
        </p>
      </div>
    </TheorySlideLayout>
  );
}
