import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";
import { FusionPipelineSvg } from "../../../_shared/visual/diagrams/FusionPipelineSvg";

export default function EqWhyFusionSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Motivation"
      title="Why sensor fusion?"
      subtitle="Each sensor is strong at different frequencies — fusion combines them."
      visualLabel="Pipeline"
      visualAccent="purple"
      visual={<FusionPipelineSvg />}
    >
      <TheoryBulletList
        items={[
          "Gyro: excellent short-term ω, poor long-term angle (bias drift).",
          "Accel: gravity direction at low frequency, corrupted by linear acceleration.",
          "Complementary / Kalman-style filters blend gyro integration with gravity correction.",
          "BMI270 firmware can publish fused Euler (0x08) and quaternion (0x10) on the wire.",
        ]}
      />
    </TheorySlideLayout>
  );
}
