import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function EqSummarySlide() {
  return (
    <TheorySlideLayout eyebrow="Summary" title="Attitude recap" subtitle="Next sensor chapters: BMM350, DPS368, SHT40.">
      <TheoryBulletList
        accent="var(--accent-green)"
        items={[
          "Fusion combines gyro short-term response with accel gravity at low frequency.",
          "Euler (0x08) — readable degrees; watch gimbal lock in advanced apps.",
          "Quaternion (0x10) — robust 3D rotation; use for models and SLERP.",
          "Live demos proved both paths via useBitstreamLiveStore — no duplicate decoder.",
        ]}
      />
    </TheorySlideLayout>
  );
}
