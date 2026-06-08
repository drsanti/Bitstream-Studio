import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function EqGimbalLockSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Euler limitation"
      title="Gimbal lock"
      subtitle="When two rotation axes align, one degree of freedom is lost in Euler parameterization."
    >
      <TheoryBulletList
        accent="var(--accent-red)"
        items={[
          "Classic issue with sequential Euler angles near ±90° pitch.",
          "Control and graphics pipelines can suffer sudden singularities.",
          "Quaternions represent orientation without this singularity (same physical rotation).",
          "BS2 still publishes Euler for human-readable plots — quaternion for robust 3D.",
        ]}
      />
    </TheorySlideLayout>
  );
}
