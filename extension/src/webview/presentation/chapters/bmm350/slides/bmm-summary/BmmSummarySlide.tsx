import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function BmmSummarySlide() {
  return (
    <TheorySlideLayout eyebrow="Summary" title="BMM350 recap" subtitle="Next: barometric pressure (DPS368) chapter.">
      <TheoryBulletList
        accent="var(--accent-green)"
        items={[
          "Tri-axis µT vector — magnitude and level heading from Bx, By.",
          "Interference and calibration matter for compass use on real hardware.",
          "Wire mask MAG / TMP on sensorId 1; Sensor Studio BMM350 + tap nodes.",
          "Combine with IMU fusion for tilt-compensated heading in advanced labs.",
        ]}
      />
    </TheorySlideLayout>
  );
}
