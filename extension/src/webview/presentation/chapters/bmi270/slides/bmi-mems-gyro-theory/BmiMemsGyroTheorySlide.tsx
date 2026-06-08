import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function BmiMemsGyroTheorySlide() {
  return (
    <TheorySlideLayout
      eyebrow="MEMS physics"
      title="Coriolis gyroscope"
      subtitle="Drive mode sets up velocity · Coriolis force from rotation · sense capacitance change."
    >
      <TheoryBulletList
        accent="var(--accent-purple)"
        items={[
          "MEMS gyro is not a spinning wheel — it is a resonating mass in silicon.",
          "Rotation about an axis couples drive and sense modes via Coriolis effect.",
          "Output is proportional to ω for each sensitive axis.",
          "Gyro demo integrates ω visually — drift shows why fusion exists.",
        ]}
      />
    </TheorySlideLayout>
  );
}
