import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2DevSimStatePayload,
  type Bitstream2DevStatusPayload,
  type Bitstream2HelloPayload,
  type Bitstream2HostReqPayload,
  type Bitstream2HostResPayload,
  type Bitstream2MetricsPayload,
  type Bitstream2SensorSamplePayload,
} from "../../../bitstream2/bridge/protocol";
import { BS2_CMD } from "../../../bitstream2/domains/config/commands";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
  encodeSensorCfgGetBody,
  encodeStreamMaskSetBody,
  encodeStreamRateSetBody,
  type Bs2SensorConfig,
} from "../../../bitstream2/domains/config/sensor-config";
import { base64ToBytes, bytesToBase64 } from "../../../bitstream2/util/base64";
import {
  SERIALPORT_TOPICS,
  type FirmwareLivenessPayload,
  type SerialPortStatusPayload,
} from "../../../serialport-bridge/protocol";
import { useWsClientStore } from "../../ws-client-store";
import {
  cfgSetRequestId,
  parseCfgSetRequestSensorId,
} from "../lib/sensorCfgDraft";

const LISTENER_ID = "bitstream2-simulator-feed";

export type SensorCfgApplyStatus = "idle" | "applying" | "ok" | "error";

export type SensorCfgApplyState = {
  status: SensorCfgApplyStatus;
  message?: string;
};

export type Bitstream2SimulatorFeed = {
  isConnected: boolean;
  devStatus: Bitstream2DevStatusPayload | null;
  simState: Bitstream2DevSimStatePayload | null;
  hello: Bitstream2HelloPayload | null;
  metrics: Bitstream2MetricsPayload | null;
  serialStatus: SerialPortStatusPayload | null;
  firmwareLiveness: FirmwareLivenessPayload | null;
  sampleCount: number;
  samplesBySensor: Record<number, Bitstream2SensorSamplePayload>;
  sampleHistory: Bitstream2SensorSamplePayload[];
  lastRes: Bitstream2HostResPayload | null;
  lastError: string | null;
  cfgApplyBySensorId: Record<number, SensorCfgApplyState>;
  sendPing: () => void;
  refreshCfg: (sensorId: number) => void;
  applyCfg: (cfg: Bs2SensorConfig) => void;
  setStreamMask: (sensorId: number, mask: number) => void;
  setStreamRate: (sensorId: number, intervalMs: number) => void;
};

const HISTORY_MAX = 48;

export function useBitstream2SimulatorFeed(): Bitstream2SimulatorFeed {
  const connect = useWsClientStore((s) => s.connect);
  const isConnected = useWsClientStore((s) => s.isConnected);
  const subscribeTopic = useWsClientStore((s) => s.subscribeTopic);
  const publish = useWsClientStore((s) => s.publish);
  const addMessageListener = useWsClientStore((s) => s.addMessageListener);
  const removeMessageListener = useWsClientStore((s) => s.removeMessageListener);

  const [devStatus, setDevStatus] = useState<Bitstream2DevStatusPayload | null>(null);
  const [simState, setSimState] = useState<Bitstream2DevSimStatePayload | null>(null);
  const [hello, setHello] = useState<Bitstream2HelloPayload | null>(null);
  const [metrics, setMetrics] = useState<Bitstream2MetricsPayload | null>(null);
  const [serialStatus, setSerialStatus] = useState<SerialPortStatusPayload | null>(null);
  const [firmwareLiveness, setFirmwareLiveness] = useState<FirmwareLivenessPayload | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [samplesBySensor, setSamplesBySensor] = useState<Record<number, Bitstream2SensorSamplePayload>>({});
  const [sampleHistory, setSampleHistory] = useState<Bitstream2SensorSamplePayload[]>([]);
  const [lastRes, setLastRes] = useState<Bitstream2HostResPayload | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [cfgApplyBySensorId, setCfgApplyBySensorId] = useState<
    Record<number, SensorCfgApplyState>
  >({});

  const publishReq = useCallback(
    (partial: Omit<Bitstream2HostReqPayload, "requestId"> & { requestId?: string }) => {
      const req: Bitstream2HostReqPayload = {
        requestId: partial.requestId ?? `sim-${Date.now()}`,
        reqId: 0,
        cmdId: partial.cmdId,
        flags: partial.flags,
        bodyB64: partial.bodyB64,
        timeoutMs: partial.timeoutMs ?? 2000,
        retryCount: partial.retryCount ?? 0,
      };
      void publish(BITSTREAM2_TOPICS.REQ, req, 0);
    },
    [publish],
  );

  const sendPing = useCallback(() => {
    publishReq({ cmdId: BS2_CMD.PING });
  }, [publishReq]);

  const refreshCfg = useCallback(
    (sensorId: number) => {
      publishReq({
        cmdId: BS2_CMD.SENSOR_CFG_GET,
        bodyB64: bytesToBase64(encodeSensorCfgGetBody(sensorId)),
      });
    },
    [publishReq],
  );

  const applyCfg = useCallback(
    (cfg: Bs2SensorConfig) => {
      const requestId = cfgSetRequestId(cfg.sensorId);
      setCfgApplyBySensorId((prev) => ({
        ...prev,
        [cfg.sensorId]: { status: "applying" },
      }));
      publishReq({
        requestId,
        cmdId: BS2_CMD.SENSOR_CFG_SET,
        bodyB64: bytesToBase64(encodeSensorCfgBody(cfg)),
      });
    },
    [publishReq],
  );

  const setStreamMask = useCallback(
    (sensorId: number, mask: number) => {
      publishReq({
        cmdId: BS2_CMD.STREAM_MASK_SET,
        bodyB64: bytesToBase64(encodeStreamMaskSetBody(sensorId, mask)),
      });
    },
    [publishReq],
  );

  const setStreamRate = useCallback(
    (sensorId: number, intervalMs: number) => {
      publishReq({
        cmdId: BS2_CMD.STREAM_RATE_SET,
        bodyB64: bytesToBase64(encodeStreamRateSetBody(sensorId, intervalMs)),
      });
    },
    [publishReq],
  );

  useEffect(() => {
    void connect();
  }, [connect]);

  useEffect(() => {
    if (!isConnected) return;
    void subscribeTopic(BITSTREAM2_TOPICS.HELLO, 0, "json");
    void subscribeTopic(BITSTREAM2_TOPICS.METRICS, 0, "json");
    void subscribeTopic(BITSTREAM2_TOPICS.EVT_SENSOR, 0, "json");
    void subscribeTopic(BITSTREAM2_TOPICS.RES, 0, "json");
    void subscribeTopic(BITSTREAM2_TOPICS.DEV_STATUS, 0, "json");
    void subscribeTopic(BITSTREAM2_TOPICS.DEV_SIM_STATE, 0, "json");
    void subscribeTopic(SERIALPORT_TOPICS.STATUS, 0, "json");
    void subscribeTopic(SERIALPORT_TOPICS.FIRMWARE_LIVENESS, 0, "json");

    addMessageListener(LISTENER_ID, (topic, payload) => {
      if (topic === SERIALPORT_TOPICS.STATUS) {
        setSerialStatus(payload as SerialPortStatusPayload);
        return;
      }
      if (topic === SERIALPORT_TOPICS.FIRMWARE_LIVENESS) {
        setFirmwareLiveness(payload as FirmwareLivenessPayload);
        return;
      }
      if (topic === BITSTREAM2_TOPICS.DEV_STATUS) {
        setDevStatus(payload as Bitstream2DevStatusPayload);
        return;
      }
      if (topic === BITSTREAM2_TOPICS.DEV_SIM_STATE) {
        setSimState(payload as Bitstream2DevSimStatePayload);
        return;
      }
      if (topic === BITSTREAM2_TOPICS.HELLO) {
        setHello(payload as Bitstream2HelloPayload);
        return;
      }
      if (topic === BITSTREAM2_TOPICS.METRICS) {
        setMetrics(payload as Bitstream2MetricsPayload);
        return;
      }
      if (topic === BITSTREAM2_TOPICS.EVT_SENSOR) {
        const p = payload as Bitstream2SensorSamplePayload;
        setSamplesBySensor((prev) => ({ ...prev, [p.sensorId]: p }));
        setSampleCount((c) => c + 1);
        setSampleHistory((prev) => {
          const next = [p, ...prev];
          return next.length > HISTORY_MAX ? next.slice(0, HISTORY_MAX) : next;
        });
        return;
      }
      if (topic === BITSTREAM2_TOPICS.RES) {
        const res = payload as Bitstream2HostResPayload;
        setLastRes(res);
        setLastError(!res.ok && res.error ? res.error : null);
        const cfgSensorId = parseCfgSetRequestSensorId(res.requestId ?? "");
        if (cfgSensorId != null) {
          setCfgApplyBySensorId((prev) => ({
            ...prev,
            [cfgSensorId]: res.ok
              ? { status: "ok", message: "Config applied" }
              : {
                  status: "error",
                  message: res.error ?? `Apply failed (status ${res.status ?? "?"})`,
                },
          }));
        }
        if (res.ok && typeof res.bodyB64 === "string") {
          decodeSensorCfgBody(base64ToBytes(res.bodyB64));
        }
      }
    });

    return () => removeMessageListener(LISTENER_ID);
  }, [addMessageListener, isConnected, removeMessageListener, subscribeTopic]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const [key, state] of Object.entries(cfgApplyBySensorId)) {
      const sensorId = Number(key);
      if (state.status === "ok") {
        timers.push(
          setTimeout(() => {
            setCfgApplyBySensorId((prev) => {
              const cur = prev[sensorId];
              if (cur?.status !== "ok") return prev;
              const next = { ...prev };
              delete next[sensorId];
              return next;
            });
          }, 2500),
        );
      }
      if (state.status === "applying") {
        timers.push(
          setTimeout(() => {
            setCfgApplyBySensorId((prev) => {
              const cur = prev[sensorId];
              if (cur?.status !== "applying") return prev;
              return {
                ...prev,
                [sensorId]: { status: "error", message: "Apply timed out" },
              };
            });
          }, 3000),
        );
      }
    }
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [cfgApplyBySensorId]);

  return useMemo(
    () => ({
      isConnected,
      devStatus,
      simState,
      hello,
      metrics,
      serialStatus,
      firmwareLiveness,
      sampleCount,
      samplesBySensor,
      sampleHistory,
      lastRes,
      lastError,
      cfgApplyBySensorId,
      sendPing,
      refreshCfg,
      applyCfg,
      setStreamMask,
      setStreamRate,
    }),
    [
      isConnected,
      devStatus,
      simState,
      hello,
      metrics,
      serialStatus,
      firmwareLiveness,
      sampleCount,
      samplesBySensor,
      sampleHistory,
      lastRes,
      lastError,
      cfgApplyBySensorId,
      sendPing,
      refreshCfg,
      applyCfg,
      setStreamMask,
      setStreamRate,
    ],
  );
}
