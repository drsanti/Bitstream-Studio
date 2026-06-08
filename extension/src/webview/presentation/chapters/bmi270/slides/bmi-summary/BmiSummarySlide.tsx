import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function BmiSummarySlide() {
  return (
    <TheorySlideLayout eyebrow="Summary" title="BMI270 recap" subtitle="Next: Euler angles & quaternion fusion chapter.">
      <TheoryBulletList
        accent="var(--accent-green)"
        items={[
          "6-DoF IMU: accel (g) + gyro (°/s) in a right-hand frame.",
          "MEMS: capacitive accel, Coriolis gyro — demos tied to live aX / ω.",
          "Activity classifier + configuration lab — range/ODR trade-offs before wire integration.",
          "Wire mask bits select ACC, GYR, TMP, EULER, QUAT in EVT_SENSOR.",
          "Continue → Euler & Quaternion for stable attitude outputs.",
        ]}
      />
    </TheorySlideLayout>
  );
}
