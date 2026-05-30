import { useCallback } from "react";
import type { RuntimeHandshakeReportPayload } from "../../../serialport-bridge/protocol";
import { useBitstreamLiveStore } from "../state/bitstreamLive.store";

/**
 * Handshake lifecycle is driven by **BS2 HELLO** + bridge `RUNTIME_SNAPSHOT` / `serialport/status`.
 * Legacy v1 `handshake.run` over webview `HostSession` has been removed.
 */
interface UseBitstreamHandshakeParams {
  publishHandshakeRuntimeReport?: (report: RuntimeHandshakeReportPayload) => void;
}

export function useBitstreamHandshake(params: UseBitstreamHandshakeParams = {}) {
  const { publishHandshakeRuntimeReport } = params;
  const handshake = useBitstreamLiveStore((s) => s.handshake);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const handshakeAttempts = useBitstreamLiveStore((s) => s.handshakeAttempts);
  const handshakeLastError = useBitstreamLiveStore((s) => s.handshakeLastError);

  const runHandshake = useCallback(async () => {
    publishHandshakeRuntimeReport?.({
      handshakeState: handshakeState === "passed" ? "passed" : "unknown",
      handshakeLastError: null,
      atMs: Date.now(),
    });
  }, [handshakeState, publishHandshakeRuntimeReport]);

  return {
    handshake,
    handshakeState,
    handshakeLastError,
    handshakeAttempts,
    runHandshake,
  };
}
