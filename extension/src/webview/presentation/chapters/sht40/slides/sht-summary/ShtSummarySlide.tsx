import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function ShtSummarySlide() {
  return (
    <TheorySlideLayout
      eyebrow="Summary"
      title="SHT40 recap"
      subtitle="All four BS2 sensor chapters complete — multi-sensor fusion labs are next backlog."
    >
      <TheoryBulletList
        accent="var(--accent-cyan)"
        items={[
          "%RH and temperature together define comfort and condensation risk.",
          "Slow RH trends suit HVAC and storage monitoring demos.",
          "Wire mask TEMP / HUM on sensorId 2; Sensor Studio SHT40 + Humidity tap.",
          "Combine BMI270 + BMM350 + DPS368 + SHT40 in Sensor Studio for full environmental flows.",
        ]}
      />
    </TheorySlideLayout>
  );
}
