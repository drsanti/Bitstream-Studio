import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";
import { ImuSixDofSvg } from "../../../_shared/visual/diagrams/ImuSixDofSvg";

export default function BmiWhatIsImuSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Foundations"
      title="What is an IMU?"
      subtitle="Inertial Measurement Unit — typically 3-axis accel + 3-axis gyro (6-DoF)."
      layout="split-50"
      visualLabel="6-DoF block"
      visualAccent="amber"
      visual={<ImuSixDofSvg />}
    >
      <TheoryBulletList
        items={[
          "Accelerometer: linear specific force (includes gravity as a reaction when supported).",
          "Gyroscope: instantaneous angular velocity ω about each axis.",
          "Applications: attitude hints, motion detection, activity, stabilization, sensor fusion.",
          "BMI270 adds on-chip motion features (step, activity) beyond raw 6-DoF.",
        ]}
      />
    </TheorySlideLayout>
  );
}
