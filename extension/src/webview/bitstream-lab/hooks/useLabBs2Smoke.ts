/*******************************************************************************
 * File Name : useLabBs2Smoke.ts
 *
 * Description : HELLO, metrics, last EVT_SENSOR, PING for BS2 smoke panel (Phase 3).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useEffect, useState } from "react";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2HelloPayload,
  type Bitstream2MetricsPayload,
  type Bitstream2SensorSamplePayload,
} from "../../../bitstream2/bridge/protocol";
import { BS2_CMD } from "../../../bitstream2/domains/config/commands";
import { SERIALPORT_TOPICS } from "../../../serialport-bridge/protocol";
import { useBitstream2ReqAwait } from "../../shared/useBitstream2ReqAwait";
import { useWsClientStore } from "../../ws-client-store";
import { appendLabActivity } from "../store/labActivity.store";

const LISTENER_ID = "bitstream-lab-bs2-smoke";

export type LabLastPingResult = {
  ok: boolean;
  status: number;
  rttMs: number;
  error?: string;
  atMs: number;
};

export type UseLabBs2SmokeOptions = {
  wsConnected: boolean;
};

export type LabBs2SmokeApi = {
  hello: Bitstream2HelloPayload | null;
  helloAgeMs: number | null;
  metrics: Bitstream2MetricsPayload | null;
  lastSample: Bitstream2SensorSamplePayload | null;
  lastSamplesBySensor: Record<number, Bitstream2SensorSamplePayload>;
  fpsBySensor: Record<number, number>;
  lastPing: LabLastPingResult | null;
  busy: boolean;
  sendPing: () => Promise<void>;
  primeHello: () => Promise<void>;
};

/**
 * Tracks BS2 broker JSON and exposes PING / handshake helpers.
 */
export function useLabBs2Smoke(options: UseLabBs2SmokeOptions): LabBs2SmokeApi {
  const { wsConnected } = options;
  const [hello, setHello] = useState<Bitstream2HelloPayload | null>(null);
  const [metrics, setMetrics] = useState<Bitstream2MetricsPayload | null>(null);
  const [lastSample, setLastSample] = useState<Bitstream2SensorSamplePayload | null>(null);
  const [lastSamplesBySensor, setLastSamplesBySensor] = useState<
    Record<number, Bitstream2SensorSamplePayload>
  >({});
  const [fpsBySensor, setFpsBySensor] = useState<Record<number, number>>({});
  const [lastPing, setLastPing] = useState<LabLastPingResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [ageTick, setAgeTick] = useState(0);
  const { sendReqAwait } = useBitstream2ReqAwait();
  const publish = useWsClientStore((s) => s.publish);
  const addMessageListener = useWsClientStore((s) => s.addMessageListener);
  const removeMessageListener = useWsClientStore((s) => s.removeMessageListener);

  useEffect(() => {
    if (!wsConnected)
    {
      return;
    }

    const onMessage = (topic: string, payload: unknown) => {
      if (topic === BITSTREAM2_TOPICS.HELLO)
      {
        setHello(payload as Bitstream2HelloPayload);
        return;
      }
      if (topic === BITSTREAM2_TOPICS.METRICS)
      {
        setMetrics(payload as Bitstream2MetricsPayload);
        return;
      }
      if (topic === BITSTREAM2_TOPICS.EVT_SENSOR)
      {
        const sample = payload as Bitstream2SensorSamplePayload;
        setLastSample(sample);
        setLastSamplesBySensor((prev) => {
          const prevSample = prev[sample.sensorId];
          if (prevSample)
          {
            const dtMs = Math.max(1, sample.atMs - prevSample.atMs);
            const dCnt = sample.counter - prevSample.counter;
            if (dCnt > 0)
            {
              const instFps = (dCnt * 1000) / dtMs;
              setFpsBySensor((fpsPrev) => {
                const prevFps = fpsPrev[sample.sensorId] ?? instFps;
                const alpha = 0.25; // light smoothing so it doesn't flicker
                const next = prevFps + alpha * (instFps - prevFps);
                return { ...fpsPrev, [sample.sensorId]: next };
              });
            }
          }
          return { ...prev, [sample.sensorId]: sample };
        });
      }
    };

    addMessageListener(LISTENER_ID, onMessage);
    return () => {
      removeMessageListener(LISTENER_ID);
    };
  }, [wsConnected, addMessageListener, removeMessageListener]);

  useEffect(() => {
    if (!wsConnected)
    {
      setHello(null);
      setMetrics(null);
      setLastSample(null);
      setLastSamplesBySensor({});
      setFpsBySensor({});
      setLastPing(null);
    }
  }, [wsConnected]);

  useEffect(() => {
    if (hello?.atMs == null)
    {
      return;
    }
    const id = setInterval(() => {
      setAgeTick((t) => t + 1);
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [hello?.atMs]);

  void ageTick;
  const helloAgeMs =
    hello?.atMs != null ? Math.max(0, Date.now() - hello.atMs) : null;

  const sendPing = useCallback(async () => {
    if (!wsConnected)
    {
      throw new Error("Connect WebSocket first");
    }
    setBusy(true);
    appendLabActivity({ text: "BS2 PING…", tone: "info" });
    const t0 = Date.now();
    try
    {
      const res = await sendReqAwait(
        {
          cmdId: BS2_CMD.PING,
          timeoutMs: 4000,
        },
        4000,
      );
      const rttMs = Date.now() - t0;
      const result: LabLastPingResult = {
        ok: res.ok,
        status: res.status,
        rttMs,
        error: res.error,
        atMs: Date.now(),
      };
      setLastPing(result);
      if (res.ok)
      {
        appendLabActivity({
          text: `PING OK (status=${res.status}, ${rttMs} ms)`,
          tone: "ok",
        });
      }
      else
      {
        appendLabActivity({
          text: `PING failed: ${res.error ?? `status=${res.status}`}`,
          tone: "error",
        });
      }
    }
    catch (e: unknown)
    {
      const msg = e instanceof Error ? e.message : String(e);
      const result: LabLastPingResult = {
        ok: false,
        status: 0xff,
        rttMs: Date.now() - t0,
        error: msg,
        atMs: Date.now(),
      };
      setLastPing(result);
      appendLabActivity({ text: `PING error: ${msg}`, tone: "error" });
      throw e;
    }
    finally
    {
      setBusy(false);
    }
  }, [wsConnected, sendReqAwait]);

  const primeHello = useCallback(async () => {
    if (!wsConnected)
    {
      throw new Error("Connect WebSocket first");
    }
    setBusy(true);
    appendLabActivity({ text: "Runtime handshake run (prime HELLO)…", tone: "info" });
    try
    {
      await publish(
        SERIALPORT_TOPICS.RUNTIME_HANDSHAKE_RUN,
        { requestId: `lab-hs-${Date.now()}`, reason: "bitstream-lab" },
        0,
      );
      appendLabActivity({ text: "Handshake run published", tone: "info" });
    }
    catch (e: unknown)
    {
      const msg = e instanceof Error ? e.message : String(e);
      appendLabActivity({ text: `Handshake run failed: ${msg}`, tone: "error" });
      throw e;
    }
    finally
    {
      setBusy(false);
    }
  }, [wsConnected, publish]);

  return {
    hello,
    helloAgeMs,
    metrics,
    lastSample,
    lastSamplesBySensor,
    fpsBySensor,
    lastPing,
    busy,
    sendPing,
    primeHello,
  };
}
