/*******************************************************************************
 * File Name : useLabSession.ts
 *
 * Description : WebSocket connect/disconnect for Bitstream Lab with lab client identity.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useEffect, useRef, useState } from "react";
import { setWsConnectClientIdentity, useWsClientStore } from "../../ws-client-store";
import { appendLabActivity } from "../store/labActivity.store";

const LAB_LISTENER_BOOT = "bitstream-lab-session";

export type UseLabSessionOptions = {
  autoConnect?: boolean;
};

export type LabSessionApi = {
  wsUrl: string;
  connectionState: string;
  isConnected: boolean;
  wsBytesReceived: number;
  wsBytesSent: number;
  setWsUrl: (url: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  lastError: string | null;
};

/* One-time broker identity for this webview session. */
function applyLabClientIdentity(): void {
  setWsConnectClientIdentity({
    role: "webview",
    name: "bitstream-lab",
    instance: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : "lab",
    meta: { app: "bitstream-lab" },
  });
}

/**
 * Shared WS session: sets lab hello identity, optional auto-connect on mount.
 */
export function useLabSession(options: UseLabSessionOptions = {}): LabSessionApi {
  const autoConnect = options.autoConnect ?? true;
  const wsUrl = useWsClientStore((s) => s.wsUrl);
  const connectionState = useWsClientStore((s) => s.connectionState);
  const isConnected = useWsClientStore((s) => s.isConnected);
  const wsBytesReceived = useWsClientStore((s) => s.wsBytesReceived);
  const wsBytesSent = useWsClientStore((s) => s.wsBytesSent);
  const setWsUrl = useWsClientStore((s) => s.setWsUrl);
  const storeConnect = useWsClientStore((s) => s.connect);
  const storeDisconnect = useWsClientStore((s) => s.disconnect);

  const [lastError, setLastError] = useState<string | null>(null);
  const identityAppliedRef = useRef(false);

  const connect = useCallback(async () => {
    if (!identityAppliedRef.current)
    {
      applyLabClientIdentity();
      identityAppliedRef.current = true;
    }
    setLastError(null);
    const url = useWsClientStore.getState().wsUrl;
    appendLabActivity({ text: `Connecting WebSocket (${url})…`, tone: "info" });
    try
    {
      await storeConnect();
      appendLabActivity({ text: `WebSocket connected (${url})`, tone: "ok" });
    }
    catch (e: unknown)
    {
      const msg = e instanceof Error ? e.message : String(e);
      setLastError(msg);
      appendLabActivity({ text: `WebSocket connect failed: ${msg}`, tone: "error" });
      throw e;
    }
  }, [storeConnect]);

  const disconnect = useCallback(async () => {
    setLastError(null);
    appendLabActivity({ text: "Disconnecting WebSocket…", tone: "info" });
    await storeDisconnect();
    appendLabActivity({ text: "WebSocket disconnected", tone: "info" });
  }, [storeDisconnect]);

  useEffect(() => {
    applyLabClientIdentity();
    identityAppliedRef.current = true;
    if (!autoConnect)
    {
      return;
    }
    void connect().catch(() => {
      /* setLastError in connect */
    });
    return () => {
      void storeDisconnect();
    };
  }, [autoConnect, connect, storeDisconnect]);

  /* Keep listener slot warm so connect path is exercised once. */
  useEffect(() => {
    const noop = () => {};
    useWsClientStore.getState().addMessageListener(LAB_LISTENER_BOOT, noop);
    return () => {
      useWsClientStore.getState().removeMessageListener(LAB_LISTENER_BOOT);
    };
  }, []);

  return {
    wsUrl,
    connectionState,
    isConnected,
    wsBytesReceived,
    wsBytesSent,
    setWsUrl,
    connect,
    disconnect,
    lastError,
  };
}
