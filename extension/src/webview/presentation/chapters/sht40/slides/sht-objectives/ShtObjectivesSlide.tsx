import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function ShtObjectivesSlide() {
  return (
    <TheorySlideLayout eyebrow="Objectives" title="What you will learn" subtitle="RH/T chapter goals.">
      <TheoryBulletList
        accent="var(--accent-cyan)"
        items={[
          "Define relative humidity (%RH) and why it pairs with temperature.",
          "Read comfort zones on a simplified T–RH chart.",
          "Decode SHT40 EVT_SENSOR payloads (sensorId 2).",
          "Wire humidity and temperature into Sensor Studio Dashboard widgets.",
        ]}
      />
    </TheorySlideLayout>
  );
}
