import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function BssTelemetryIntroSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Sensor Telemetry"
      title="Operator console for live BS2"
      subtitle="Connect, route, configure sensors, and inspect decoded samples."
    >
      <TheoryBulletList
        accent="var(--accent-cyan)"
        items={[
          "Toolbar: COM link, telemetry source (Hardware vs Simulator), workspace switcher.",
          "Sensor settings deck: SENSOR_CFG draft, publish masks, per-sensor rates.",
          "Live plots and diagnostics: handshake, stream rates, EVT_SENSOR counters.",
          "This is where you establish the link before demoing slides or Sensor Studio flows.",
        ]}
      />
    </TheorySlideLayout>
  );
}
