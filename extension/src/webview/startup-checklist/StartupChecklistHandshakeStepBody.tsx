import { useState } from "react";
import { toast } from "react-toastify";
import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import { openUartPortAndHandshake } from "../bitstream-app/bridge/openUartPortAndHandshake.js";
import { useConnectionPanelStore } from "../bitstream-app/connection/connectionPanel.store.js";
import { useBitstreamTelemetrySourceStore } from "../bitstream-app/state/bitstreamTelemetrySource.store.js";
import { useBitstreamLiveStore } from "../bitstream-app/state/bitstreamLive.store.js";
import { userFacingHandshakeFailureCopy } from "../bitstream-app/utils/bitstreamHandshakeFailureCopy.js";
import { useStartupChecklistStore } from "./startupChecklist.store.js";
import { TRNButton } from "../ui/TRN/TRNButton.js";

const C = ternionFreeAssetPackCopy.checklist;

const ACTION_BTN_CLASS = "whitespace-nowrap";

export function StartupChecklistHandshakeStepBody(props: {
  rawError: string | null | undefined;
  onFocusSerialPorts: () => void;
}) {
  const { rawError, onFocusSerialPorts } = props;
  const setBackend = useBitstreamTelemetrySourceStore((s) => s.setBackend);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const [switchingSimulator, setSwitchingSimulator] = useState(false);

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

  const continueSimulatorOnly = async () => {
    if (useBitstreamTelemetrySourceStore.getState().backend === "simulator") {
      toast.info(C.handshakeSimulatorReady);
      return;
    }
    setSwitchingSimulator(true);
    try {
      setBackend("simulator");
      toast.success(C.handshakeSimulatorReady);
      useStartupChecklistStore.getState().openPanel();
    } finally {
      setSwitchingSimulator(false);
    }
  };

  const handleChoosePort = () => {
    onFocusSerialPorts();
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

      <div className="grid grid-cols-2 gap-2">
        <TRNButton
          size="compact"
          selected
          className={ACTION_BTN_CLASS}
          hint={C.handshakeRetryHint}
          onClick={() => void retryHandshake()}
        >
          {C.handshakeRetry}
        </TRNButton>
        <TRNButton
          size="compact"
          className={ACTION_BTN_CLASS}
          onClick={handleChoosePort}
          hint="Expands Board connection to pick or open a COM port."
        >
          {C.handshakeChoosePort}
        </TRNButton>
        <TRNButton
          size="compact"
          className={ACTION_BTN_CLASS}
          disabled={switchingSimulator}
          hint={C.handshakeSimulatorOnlyHint}
          onClick={() => void continueSimulatorOnly()}
        >
          {switchingSimulator ? C.handshakeSwitchingSimulator : C.handshakeSimulatorOnly}
        </TRNButton>
        <TRNButton
          size="compact"
          className={ACTION_BTN_CLASS}
          hint={C.handshakeConnectionDetailsHint}
          onClick={() => useConnectionPanelStore.getState().openPanel("handshake")}
        >
          {C.handshakeConnectionDetails}
        </TRNButton>
      </div>
    </div>
  );
}
