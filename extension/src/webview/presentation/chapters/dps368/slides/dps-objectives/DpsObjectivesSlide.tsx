import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function DpsObjectivesSlide() {
  return (
    <TheorySlideLayout eyebrow="Objectives" title="What you will learn" subtitle="Barometric pressure chapter goals.">
      <TheoryBulletList
        accent="var(--accent-cyan)"
        items={[
          "Read absolute pressure in hPa and relate it to altitude.",
          "Interpret slow pressure trends (weather, HVAC, doors).",
          "Decode DPS368 EVT_SENSOR payloads (sensorId 3).",
          "Wire pressure into Sensor Studio Dashboard and Stage flows.",
        ]}
      />
    </TheorySlideLayout>
  );
}
