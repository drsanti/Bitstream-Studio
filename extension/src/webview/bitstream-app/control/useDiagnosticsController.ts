import { useCallback } from "react";
import type { HandshakeLifecycleState } from "../state/bitstreamLive.store.js";

/**
 * Diagnostics over legacy v1 `HostSession` has been removed. BS2 diagnostics will replace this surface.
 */
export function useDiagnosticsController(deps: {
  handshakeState: HandshakeLifecycleState;
  isTransportReady: boolean;
  systemDiagnosticsOpen: boolean;
}) {
  const { handshakeState, isTransportReady, systemDiagnosticsOpen } = deps;

  const getDiagSnapshot = useCallback(async (): Promise<null> => {
    void handshakeState;
    void isTransportReady;
    void systemDiagnosticsOpen;
    return null;
  }, [handshakeState, isTransportReady, systemDiagnosticsOpen]);

  const setDiagTaskPriority = useCallback(
    async (_taskId: number, _newPriority: number): Promise<boolean> => false,
    [],
  );

  const setDiagTaskStreamConfig = useCallback(
    async (_options: {
      taskPeriodMs: number;
      maxRowsPerBatch: number;
      priorityMode: "sensor" | "diagnostics";
      resyncPeriodMs: number;
    }): Promise<{ ok: boolean; message: string }> => ({
      ok: false,
      message: "Diagnostics v1 HostSession removed (BS2 TBD)",
    }),
    [],
  );

  const diagTaskStreamResyncNow = useCallback(
    async (): Promise<{ ok: boolean; message: string }> => ({
      ok: false,
      message: "Diagnostics v1 HostSession removed (BS2 TBD)",
    }),
    [],
  );

  const startDiagStream = useCallback(
    async (_globalPeriodMs: number, _taskPeriodMs: number): Promise<{ ok: boolean; message: string }> => ({
      ok: false,
      message: "Diagnostics v1 HostSession removed (BS2 TBD)",
    }),
    [],
  );

  const stopDiagStream = useCallback(
    async (): Promise<{ ok: boolean; message: string }> => ({
      ok: false,
      message: "Diagnostics v1 HostSession removed (BS2 TBD)",
    }),
    [],
  );

  return {
    getDiagSnapshot,
    setDiagTaskPriority,
    setDiagTaskStreamConfig,
    diagTaskStreamResyncNow,
    startDiagStream,
    stopDiagStream,
  };
}
