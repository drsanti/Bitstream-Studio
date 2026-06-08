import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { EulerGimbalRingsSvg } from "../../../_shared/visual/diagrams/EulerGimbalRingsSvg";

export default function EqEulerAnglesSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Euler angles"
      title="Roll · pitch · yaw"
      subtitle="Three successive rotations about body axes — intuitive for humans and dashboards."
      visualLabel="Gimbal rings"
      visualAccent="purple"
      visual={<EulerGimbalRingsSvg />}
    >
      <p className="max-w-xl text-sm text-[var(--text-secondary)]">
        BS2 publishes heading, pitch, roll in radians ×100 when EVT mask includes{" "}
        <span className="font-semibold text-[var(--accent-cyan)]">0x08 EULER</span>.
      </p>
    </TheorySlideLayout>
  );
}
