import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function BmmObjectivesSlide() {
  return (
    <TheorySlideLayout eyebrow="Objectives" title="What you will learn" subtitle="Magnetometer chapter goals.">
      <TheoryBulletList
        accent="var(--accent-green)"
        items={[
          "Describe Earth's magnetic field vector and read Bx, By, Bz in µT.",
          "Compute level heading with atan2(By, Bx) and discuss tilt compensation limits.",
          "Recognize hard-iron / soft-iron distortion sources on real boards.",
          "Decode BMM350 EVT_SENSOR payloads (sensorId 1) and wire them in Sensor Studio.",
        ]}
      />
    </TheorySlideLayout>
  );
}
