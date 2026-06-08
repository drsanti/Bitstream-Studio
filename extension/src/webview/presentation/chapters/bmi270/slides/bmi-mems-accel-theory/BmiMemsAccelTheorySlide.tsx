import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";
import { MemsCrossSectionSvg } from "../../../_shared/visual/diagrams/MemsCrossSectionSvg";

export default function BmiMemsAccelTheorySlide() {
  return (
    <TheorySlideLayout
      eyebrow="MEMS physics"
      title="Capacitive accelerometer"
      subtitle="Proof mass on springs · interdigitated fingers · differential capacitance."
      visualLabel="Cross-section"
      visualAccent="amber"
      visual={<MemsCrossSectionSvg />}
    >
      <TheoryBulletList
        accent="var(--accent-amber)"
        items={[
          "Proof mass displacement ∝ acceleration along the sensing axis.",
          "Fixed vs mobile electrode fingers form C1 and C2 — ΔC = C1 − C2.",
          "Σ-Δ ADC converts capacitance change to digital LSBs.",
          "Next demo animates mass displacement from live aX.",
        ]}
      />
    </TheorySlideLayout>
  );
}
