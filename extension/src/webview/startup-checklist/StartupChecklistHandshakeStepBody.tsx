import { toast } from "react-toastify";
import { openUartPortAndHandshake } from "../bitstream-app/bridge/openUartPortAndHandshake.js";
import { useBitstreamTelemetrySourceStore } from "../bitstream-app/state/bitstreamTelemetrySource.store.js";
import { useBitstreamLiveStore } from "../bitstream-app/state/bitstreamLive.store.js";
import { userFacingHandshakeFailureCopy } from "../bitstream-app/utils/bitstreamHandshakeFailureCopy.js";
import { useConnectionPanelStore } from "../bitstream-app/connection/connectionPanel.store.js";
import { useStartupChecklistStore } from "./startupChecklist.store.js";
import { TRNButton } from "../ui/TRN/TRNButton.js";

export function StartupChecklistHandshakeStepBody(props: {
  rawError: string | null | undefined;
  onFocusSerialPorts: () => void;
}) {
  const { rawError, onFocusSerialPorts } = props;
  const setBackend = useBitstreamTelemetrySourceStore((s) => s.setBackend);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);

  const copy =
    rawError != null && rawError.trim().length > 0
      ? userFacingHandshakeFailureCopy(rawError)
      : handshakeState === "failed"
        ? userFacingHandshakeFailureCopy(
            useBitstreamLiveStore.getState().handshakeLastError ?? "Handshake failed",
          )
        : null;

  const retryHandshake = async () => {
    try {
      await openUartPortAndHandshake({ forceFullBringUp: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(message);
    }
  };

  const continueSimulatorOnly = () => {
    setBackend("simulator");
    useStartupChecklistStore.getState().openPanel();
  };

  return (
    <div className="space-y-2">
      {copy != null ? (
        <div className="rounded border border-rose-500/25 bg-rose-950/20 px-2 py-2 text-[10px] leading-relaxed text-rose-100/90">
          <p className="font-medium text-rose-50">{copy.headline}</p>
          <p className="mt-1 text-rose-100/85">{copy.hint}</p>
          {copy.technicalLine ? (
            <p className="mt-2 font-mono text-[9px] text-zinc-500">{copy.technicalLine}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-[10px] text-zinc-400">
          Waiting for firmware HELLO after the serial port is open.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <TRNButton size="compact" selected onClick={() => void retryHandshake()}>
          Retry handshake
        </TRNButton>
        <TRNButton size="compact" onClick={onFocusSerialPorts}>
          Choose port
        </TRNButton>
        <TRNButton
          size="compact"
          onClick={continueSimulatorOnly}
          hint="Switch telemetry to Simulator and close COM. Live UART telemetry will stop until you switch back."
        >
          Continue in Simulator only
        </TRNButton>
        <TRNButton
          size="compact"
          onClick={() => useConnectionPanelStore.getState().openPanel("handshake")}
        >
          Connection details
        </TRNButton>
      </div>
    </div>
  );
}
