import { usePresentationBridgeStatus } from "../../../../app/usePresentationLive";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span
        className="text-sm font-semibold"
        style={{ color: ok === true ? "var(--status-live)" : ok === false ? "var(--text-muted)" : "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function BssDemoBridgeSlide() {
  const status = usePresentationBridgeStatus();

  return (
    <DemoSlideLayout
      title="Live broker status"
      subtitle="Reads the same connection and live-store fields as Sensor Telemetry."
      theoryStrip="Bridge WebSocket + telemetry route must be up before EVT_SENSOR samples reach slides."
      footer="Start bridge (`npm run start:bridge`) and connect in Sensor Telemetry, or run external Simulator."
    >
      <div className="grid max-w-xl grid-cols-1 gap-2">
        <StatusRow label="WebSocket" value={status.wsConnected ? "Connected" : "Disconnected"} ok={status.wsConnected} />
        <StatusRow label="COM / link" value={status.comConnected ? "Connected" : "Disconnected"} ok={status.comConnected} />
        <StatusRow label="Telemetry source" value={status.telemetryBackend} />
        <StatusRow label="Handshake" value={status.handshakeState} ok={status.handshakeState === "passed"} />
        <StatusRow label="Firmware liveness" value={status.firmwareLiveness} ok={status.firmwareLiveness === "alive"} />
        <StatusRow label="Decoded samples (session)" value={String(status.sampleCount)} />
        <StatusRow label="EVT_SENSOR RX (BS2)" value={String(status.evtSensorRxCount)} />
      </div>
    </DemoSlideLayout>
  );
}
