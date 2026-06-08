import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function BssProblemSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Context"
      title="MCU sensor data is hard to use raw"
      subtitle="Bitstream Studio exists to decode, configure, and visualize BS2 telemetry in one place."
    >
      <TheoryBulletList
        items={[
          "Firmware publishes compact binary EVT_SENSOR frames — not human-readable plots.",
          "Four sensors share one UART link; you need routing, masks, and per-sensor decode.",
          "Operators need live views, configuration, and 3D/flow outputs without rewriting decoders.",
          "Training needs the same live path instructors use in Sensor Telemetry and Sensor Studio.",
        ]}
      />
    </TheorySlideLayout>
  );
}
