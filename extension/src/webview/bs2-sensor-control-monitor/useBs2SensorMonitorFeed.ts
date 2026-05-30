import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2DevSimStatePayload,
  type Bitstream2DevStatusPayload,
  type Bitstream2HelloPayload,
} from "../../bitstream2/bridge/protocol";
import { normalizeSensorCfg, type Bs2SensorConfig } from "../../bitstream2/domains/config/sensor-config";
import {
  SERIALPORT_TOPICS,
  type FirmwareLivenessPayload,
  type SerialPortStatusPayload,
} from "../../serialport-bridge/protocol";
import { useWsClientStore } from "../ws-client-store";

const LISTENER_ID = "bs2-sensor-control-monitor-feed";

export type Bs2SensorMonitorFeed = {
  isConnected: boolean;
  wsUrl: string;
  devStatus: Bitstream2DevStatusPayload | null;
  simState: Bitstream2DevSimStatePayload | null;
  hello: Bitstream2HelloPayload | null;
  serialStatus: SerialPortStatusPayload | null;
  firmwareLiveness: FirmwareLivenessPayload | null;
  sampleCount: number;
  cfgBySensorId: Partial<Record<number, Bs2SensorConfig>>;
  loopbackEnabled: boolean;
  uartOpen: boolean;
  applyLocalCfg: (cfg: Bs2SensorConfig) => void;
  connect: () => Promise<void>;
};

export function useBs2SensorMonitorFeed(): Bs2SensorMonitorFeed {
  const connect = useWsClientStore((s) => s.connect);
  const isConnected = useWsClientStore((s) => s.isConnected);
  const wsUrl = useWsClientStore((s) => s.wsUrl);
  const subscribeTopic = useWsClientStore((s) => s.subscribeTopic);
  const addMessageListener = useWsClientStore((s) => s.addMessageListener);
  const removeMessageListener = useWsClientStore((s) => s.removeMessageListener);

  const [devStatus, setDevStatus] = useState<Bitstream2DevStatusPayload | null>(null);
  const [simState, setSimState] = useState<Bitstream2DevSimStatePayload | null>(null);
  const [hello, setHello] = useState<Bitstream2HelloPayload | null>(null);
  const [serialStatus, setSerialStatus] = useState<SerialPortStatusPayload | null>(null);
  const [firmwareLiveness, setFirmwareLiveness] = useState<FirmwareLivenessPayload | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [localCfgBySensorId, setLocalCfgBySensorId] = useState<Partial<Record<number, Bs2SensorConfig>>>(
    {},
  );

  const simCfgBySensorId = useMemo(() => {
    const out: Partial<Record<number, Bs2SensorConfig>> = {};
    for (const row of simState?.configs ?? []) {
      out[row.sensorId] = normalizeSensorCfg({
        publishIntervalMs: 0,
        ...row,
      } as Bs2SensorConfig);
    }
    return out;
  }, [simState?.configs]);

  const cfgBySensorId = useMemo(
    () => ({ ...simCfgBySensorId, ...localCfgBySensorId }),
    [localCfgBySensorId, simCfgBySensorId],
  );

  const applyLocalCfg = useCallback((cfg: Bs2SensorConfig) => {
    setLocalCfgBySensorId((prev) => ({
      ...prev,
      [cfg.sensorId]: normalizeSensorCfg(cfg),
    }));
  }, []);

  useEffect(() => {
    void connect();
  }, [connect]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    void subscribeTopic(BITSTREAM2_TOPICS.HELLO, 0, "json");
    void subscribeTopic(BITSTREAM2_TOPICS.EVT_SENSOR, 0, "json");
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
      if (topic === BITSTREAM2_TOPICS.EVT_SENSOR) {
        setSampleCount((c) => c + 1);
      }
    });

    return () => removeMessageListener(LISTENER_ID);
  }, [addMessageListener, isConnected, removeMessageListener, subscribeTopic]);

  const loopbackEnabled = devStatus?.loopbackEnabled === true;
  const uartOpen = serialStatus?.isOpen === true;

  return useMemo(
    () => ({
      isConnected,
      wsUrl,
      devStatus,
      simState,
      hello,
      serialStatus,
      firmwareLiveness,
      sampleCount,
      cfgBySensorId,
      loopbackEnabled,
      uartOpen,
      applyLocalCfg,
      connect,
    }),
    [
      applyLocalCfg,
      cfgBySensorId,
      connect,
      devStatus,
      firmwareLiveness,
      hello,
      isConnected,
      loopbackEnabled,
      sampleCount,
      serialStatus,
      simState,
      uartOpen,
      wsUrl,
    ],
  );
}
