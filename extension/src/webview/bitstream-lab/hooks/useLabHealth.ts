/*******************************************************************************
 * File Name : useLabHealth.ts
 *
 * Description : Derived health flags from broker JSON (hello, serial, loopback).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef, useState } from "react";
import { appendLabActivity } from "../store/labActivity.store";
import { BITSTREAM2_TOPICS, type Bitstream2DevStatusPayload, type Bitstream2HelloPayload } from "../../../bitstream2/bridge/protocol";
import type { LabHealthSnapshot } from "../types/labTypes";
import { useSerialPortStore } from "../../serialport/serial-port-store";
import { useWsClientStore } from "../../ws-client-store";

const LISTENER_ID = "bitstream-lab-health";

const HELLO_STALE_MS = 30_000;

/**
 * Subscribes to status topics and exposes chip-friendly health snapshot.
 */
export function useLabHealth(isConnected: boolean): LabHealthSnapshot {
  const [helloAtMs, setHelloAtMs] = useState<number | null>(null);
  const [loopbackOn, setLoopbackOn] = useState(false);
  const serialStatus = useSerialPortStore((s) => s.status);
  const sessionClosedByUser = useSerialPortStore((s) => s.sessionClosedByUser);
  const serialOpen =
    serialStatus?.isOpen === true && !sessionClosedByUser;
  const lastHelloLogAtRef = useRef(0);
  const addMessageListener = useWsClientStore((s) => s.addMessageListener);
  const removeMessageListener = useWsClientStore((s) => s.removeMessageListener);

  useEffect(() => {
    if (!isConnected)
    {
      return;
    }

    const onMessage = (topic: string, payload: unknown) => {
      if (topic === BITSTREAM2_TOPICS.HELLO)
      {
        const p = payload as Bitstream2HelloPayload;
        const at = p.atMs ?? Date.now();
        setHelloAtMs(at);
        if (at - lastHelloLogAtRef.current > 2000)
        {
          lastHelloLogAtRef.current = at;
          const ver = p.version != null ? String(p.version) : "?";
          appendLabActivity({ text: `HELLO received (version ${ver})`, tone: "ok", atMs: at });
        }
        return;
      }
      if (topic === BITSTREAM2_TOPICS.DEV_STATUS)
      {
        const p = payload as Bitstream2DevStatusPayload;
        setLoopbackOn(p.loopbackEnabled === true);
      }
    };

    addMessageListener(LISTENER_ID, onMessage);
    return () => {
      removeMessageListener(LISTENER_ID);
    };
  }, [isConnected, addMessageListener, removeMessageListener]);

  useEffect(() => {
    if (!isConnected)
    {
      setHelloAtMs(null);
      setLoopbackOn(false);
      lastHelloLogAtRef.current = 0;
    }
  }, [isConnected]);

  const now = Date.now();
  const helloAgeMs = helloAtMs != null ? now - helloAtMs : null;
  const bs2Linked = helloAgeMs != null && helloAgeMs < HELLO_STALE_MS;

  return {
    brokerUp: isConnected,
    serialOpen,
    bs2Linked,
    loopbackOn,
    helloAgeMs,
  };
}
