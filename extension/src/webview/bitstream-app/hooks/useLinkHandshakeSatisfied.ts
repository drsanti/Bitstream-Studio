import { useMemo } from "react";
import { useBitstreamConnectionStore } from "../state/bitstreamConnection.store.js";
import { useBitstreamLiveStore } from "../state/bitstreamLive.store.js";
import { useBitstreamTelemetrySourceStore } from "../state/bitstreamTelemetrySource.store.js";
import { isLinkHandshakeSatisfied } from "../utils/bitstreamTelemetryTransport.js";

/**
 * BS2-aware handshake gate: legacy `passed` or stored BS2 HELLO with transport ready.
 * Read-only — store promotion runs in HELLO / serial-open handlers ({@link reconcileBs2HandshakePassedFromStores}).
 */
export function useLinkHandshakeSatisfied(): boolean {
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const connected = useBitstreamConnectionStore((s) => s.connected);
  const transportState = useBitstreamConnectionStore((s) => s.transportState);
  const serialBridgeStatus = useBitstreamConnectionStore((s) => s.serialBridgeStatus);
  // Subscribe so HELLO + COM transitions recompute the gate (primitives only — no object selectors).
  useBitstreamTelemetrySourceStore((s) => s.bs2Hello);

  const connSnap = useMemo(
    () => ({
      connected,
      transportState,
      serialBridgeStatus,
    }),
    [connected, transportState, serialBridgeStatus],
  );

  return isLinkHandshakeSatisfied(handshakeState, connSnap);
}
