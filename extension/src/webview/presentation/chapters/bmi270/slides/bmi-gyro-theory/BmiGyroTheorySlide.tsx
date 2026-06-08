import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function BmiGyroTheorySlide() {
  return (
    <TheorySlideLayout
      eyebrow="Gyroscope"
      title="Angular rate ω (°/s)"
      subtitle="Gyroscopes measure spin rate — integrating ω gives angle, but bias causes drift."
    >
      <TheoryBulletList
        accent="var(--accent-amber)"
        items={[
          "ωX / ωY / ωZ: roll, pitch, yaw rates in the sensor frame.",
          "Short integrations track fast motion; long integrations drift without correction.",
          "Accelerometer gives gravity direction at low frequency — fusion combines both.",
          "Firmware fusion outputs Euler angles and quaternion — next chapter.",
        ]}
      />
    </TheorySlideLayout>
  );
}
