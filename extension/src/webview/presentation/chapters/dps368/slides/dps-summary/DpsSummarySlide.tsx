import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function DpsSummarySlide() {
  return (
    <TheorySlideLayout eyebrow="Summary" title="DPS368 recap" subtitle="Next: SHT40 temperature & humidity chapter.">
      <TheoryBulletList
        accent="var(--accent-cyan)"
        items={[
          "Absolute pressure (hPa) trends with altitude and weather.",
          "Derived altitude needs a stable reference P₀ — recalibrate when weather shifts.",
          "Wire mask PRESS / TMP on sensorId 3; Sensor Studio DPS368 + Pressure tap.",
          "Combine with IMU for floor detection; with SHT40 for comfort monitoring.",
        ]}
      />
    </TheorySlideLayout>
  );
}
