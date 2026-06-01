import { useCallback } from "react";
import { useBitstreamTransportActionsOptional } from "../../bitstream-app/context/bitstreamTransportActions.context.tsx";
import type { ConnectionStepId } from "../../bitstream-app/connection/connectionPanel.store.js";
import { useConnectionPanelStore } from "../../bitstream-app/connection/connectionPanel.store.js";
import { useLinkHandshakeSatisfied } from "../../bitstream-app/hooks/useLinkHandshakeSatisfied.js";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store.js";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store.js";
import { useBitstreamTelemetrySourceStore } from "../../bitstream-app/state/bitstreamTelemetrySource.store.js";
import type { BitstreamBootLifecycleBarProps } from "../ui/BitstreamBootLifecycleBar.js";
import {
  computeLinkLifecycleHeaderStatus,
  isLinkLifecycleReady,
} from "../ui/link-lifecycle-model.js";

/** Connection + boot lifecycle fields for {@link LinkLifecycleStrip} (store-driven). */
export function useLinkLifecycleBarInputs(): BitstreamBootLifecycleBarProps {
  const connected = useBitstreamConnectionStore((s) => s.connected);
  const connecting = useBitstreamConnectionStore((s) => s.connecting);
  const transportState = useBitstreamConnectionStore((s) => s.transportState);
  const runtimeSyncState = useBitstreamConnectionStore((s) => s.runtimeSyncState);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const transportActions = useBitstreamTransportActionsOptional();
  const firmwareSensorTruthReady = transportActions?.firmwareSensorTruthReady ?? false;
  const openConnectionPanel = useConnectionPanelStore((s) => s.openPanel);

  const onOpenConnection = useCallback(
    (stepId?: string) => {
      openConnectionPanel(stepId as ConnectionStepId | undefined);
    },
    [openConnectionPanel],
  );

  return {
    connected,
    connecting,
    transportState,
    runtimeSyncState,
    handshakeState,
    firmwareSensorTruthReady,
    onOpenConnection,
  };
}

export function useLinkLifecycleReadyFromStores(): boolean {
  const inputs = useLinkLifecycleBarInputs();
  const handshakeOk = useLinkHandshakeSatisfied();
  const telemetryBackend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const status = computeLinkLifecycleHeaderStatus({
    ...inputs,
    handshakeOk,
    telemetryBackend,
  });
  return isLinkLifecycleReady(status);
}
