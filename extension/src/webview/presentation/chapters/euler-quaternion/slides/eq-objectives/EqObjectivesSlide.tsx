import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function EqObjectivesSlide() {
  return (
    <TheorySlideLayout eyebrow="Learning objectives" title="Attitude representation">
      <TheoryBulletList
        accent="var(--accent-purple)"
        items={[
          "Explain why integrating gyro alone drifts over time.",
          "Read roll, pitch, yaw (Euler) from the live store when mask 0x08 is published.",
          "Interpret unit quaternion w, x, y, z and why it avoids gimbal lock.",
          "Compare when to display Euler vs drive 3D with quaternion.",
        ]}
      />
    </TheorySlideLayout>
  );
}
