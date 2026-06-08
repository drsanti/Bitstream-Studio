import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function BmiObjectivesSlide() {
  return (
    <TheorySlideLayout eyebrow="Learning objectives" title="BMI270 chapter">
      <TheoryBulletList
        accent="var(--accent-amber)"
        items={[
          "Distinguish accelerometer (specific force in g) from gyroscope (angular rate in °/s).",
          "Read tri-axis data using the right-hand sensor frame.",
          "Explain MEMS capacitive sensing at a teaching level.",
          "Decode BMI270 EVT_SENSOR payloads from the live store.",
          "Continue to Euler & Quaternion chapter for fusion outputs.",
        ]}
      />
    </TheorySlideLayout>
  );
}
