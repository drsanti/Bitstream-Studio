import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";
import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { UartHandshakeSvg } from "../../../_shared/visual/diagrams/UartHandshakeSvg";

export default function BssTelemetryConnectSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Sensor Telemetry"
      title="Connecting hardware"
      subtitle="Bridge + COM link + HELLO handshake before the settings deck and live plots unlock."
      visualLabel="Bring-up sequence"
      visualAccent="cyan"
      visual={<UartHandshakeSvg />}
    >
      <TheoryBulletList
        accent="var(--accent-cyan)"
        items={[
          "Start the serial bridge: `npm run start:bridge` (WebSocket `ws://127.0.0.1:9998`).",
          "Toolbar → Bitstream mode → pick COM port → open @ 921600 baud.",
          "HELLO REQ/RES exchanges caps; handshake state must pass before SENSOR_CFG UI is considered ready.",
          "Readiness is not “COM open alone” — use the connection bar and `bss-demo-bridge` slide to verify.",
          "No hardware? Switch to Simulator and stream from the external bitstream-simulator VSIX instead.",
        ]}
      />
    </TheorySlideLayout>
  );
}
