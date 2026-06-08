import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";
import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { SimulatorExtSvg } from "../../../_shared/visual/diagrams/SimulatorExtSvg";

export default function BssSimulatorExtSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Ecosystem"
      title="Bitstream Simulator"
      subtitle="Separate VSIX — virtual MCU on the same broker contract as real UART."
      visualLabel="Dual runtime"
      visualAccent="purple"
      visual={<SimulatorExtSvg />}
      footer="Path: D:\\CODE\\2026\\ternion-t3d\\bitstream-simulator · skill bitstream-simulator-app"
    >
      <TheoryBulletList
        accent="var(--accent-purple)"
        items={[
          "Install the external bitstream-simulator extension → set Streaming → toolbar Simulator mode in Bitstream Studio.",
          "Publishes bitstream2/sim/status; injects RX via bitstream2/dev/inject-rx — bridge gates UART while sim is active.",
          "Same EVT_SENSOR decode path as hardware — Presentation demos and Sensor Studio flows work unchanged.",
          "Classroom default when no PSoC board: start bridge, run sim, switch route (see bss-telemetry-modes).",
        ]}
      />
    </TheorySlideLayout>
  );
}
