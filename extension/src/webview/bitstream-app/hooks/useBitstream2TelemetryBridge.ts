import { useCallback, useEffect, useRef } from "react";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2DevSimStatePayload,
  type Bitstream2DevStatusPayload,
  type Bitstream2HelloPayload,
  type Bitstream2SensorSamplePayload,
} from "../../../bitstream2/bridge/protocol";
import {
  SERIALPORT_TOPICS,
  type BridgeRuntimeSnapshotPayload,
  type SerialPortStatusPayload,
} from "../../../serialport-bridge/protocol";
import type { BitstreamSensorSampleV2 } from "../../../bitstream/events/sensor-decoder.js";
import { bs2SampleToBitstreamSensorSampleV2 } from "../bridge/bs2-sample-to-live-v2";
import { useBitstreamTelemetrySourceStore } from "../state/bitstreamTelemetrySource.store";
import { useBitstreamConnectionStore } from "../state/bitstreamConnection.store";
import { useBitstreamLiveStore } from "../state/bitstreamLive.store";
import { publishDevSimStreamingControl, publishDevSimStreamingIdle } from "../bridge/publishDevSimStreamingControl.js";
import { publishTelemetryRoute } from "../bridge/publishTelemetryRoute.js";
import {
  isSimulatorTelemetryBackend,
  reconcileBs2HandshakePassedFromStores,
  shouldAcceptBs2Hello,
  shouldAcceptBs2SampleOrigin,
  shouldIngestTelemetry,
  type TelemetryTransportSnapshot,
} from "../utils/bitstreamTelemetryTransport.js";
import { useWsClientStore } from "../../ws-client-store";
import type { HandshakeSummary } from "../state/bitstreamLive.store";
import { Bs2WireRxWindowAccumulator } from "../bridge/bs2WireRxWindowAccumulator";

const LISTENER_ID = "bitstream-app-bs2-telemetry-bridge";

const BMI270_WIRE_GAP_RING_MAX = 64;

/** VSIX: extension spawns the bridge async; dev usually has `start:bridge` already up. */
const WS_CONNECT_RETRY_MS = 500;
const WS_CONNECT_MAX_ATTEMPTS = 40;

/** External sim online: mark loopback when BS2 arrives without open COM (status hint only). */
function noteExternalSimulatorOnline(conn: TelemetryTransportSnapshot): void {
  if (conn.serialBridgeStatus?.isOpen === true) {
    return;
  }
  if (!useBitstreamTelemetrySourceStore.getState().loopbackAvailable) {
    useBitstreamTelemetrySourceStore.getState().setLoopbackAvailable(true);
  }
}

export type Bitstream2TelemetryBridgeHandlers = {
  onBs2Sample: (sample: BitstreamSensorSampleV2) => void;
  setHandshakeFromBs2?: (summary: HandshakeSummary) => void;
  setHandshakeState?: (state: "passed" | "unknown") => void;
  /** After simulator `DEV_SIM_STATE` merges verified sensor rows (no UART cold sync). */
  onSimConfigsSynced?: () => void;
};

/**
 * Subscribes to `bitstream2/*` broker topics and maps samples into the legacy live-store shape.
 * Used for UART (BS-framed firmware) and dev loopback simulator.
 */
export function useBitstream2TelemetryBridge(handlers: Bitstream2TelemetryBridgeHandlers): void {
  const connect = useWsClientStore((s) => s.connect);
  const isConnected = useWsClientStore((s) => s.isConnected);
  const telemetryBackend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const subscribeTopic = useWsClientStore((s) => s.subscribeTopic);
  const addMessageListener = useWsClientStore((s) => s.addMessageListener);
  const removeMessageListener = useWsClientStore((s) => s.removeMessageListener);

  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const bmi270GapsRef = useRef<number[]>([]);
  const bmi270LastPerfRef = useRef<number | null>(null);
  const wireRxWindowRef = useRef<Bs2WireRxWindowAccumulator | null>(null);

  const getTelemetryConnSnapshot = useCallback(() => {
    const c = useBitstreamConnectionStore.getState();
    return {
      connected: c.connected,
      transportState: c.transportState,
      serialBridgeStatus: c.serialBridgeStatus,
    };
  }, []);

  const markRuntimeReadyForBs2Link = useCallback(() => {
    const conn = useBitstreamConnectionStore.getState();
    const wsUp = useWsClientStore.getState().isConnected;
    const simUp =
      conn.transportState === "connected" ||
      (isSimulatorTelemetryBackend() && wsUp);
    if (simUp && conn.runtimeSyncState !== "ready") {
      conn.setRuntimeSyncState("ready");
      if (!conn.connected && wsUp) {
        conn.setConnected(true);
        conn.setTransportState("connected");
      }
    }
  }, []);

  const applyHello = useCallback((hello: Bitstream2HelloPayload) => {
    if (!shouldAcceptBs2Hello(getTelemetryConnSnapshot())) {
      return;
    }
    useBitstreamTelemetrySourceStore.getState().setBs2Hello(hello);
    useBitstreamLiveStore.getState().touchFirmwareRxAt();
    // BS HELLO applies to simulator and UART (BS-framed firmware on serial).
    handlersRef.current.setHandshakeFromBs2?.({
      protocolVersion: hello.version,
      capsFlags: hello.caps,
      statusCounter: 0,
      totalDurationMs: 0,
    });
    handlersRef.current.setHandshakeState?.("passed");
    reconcileBs2HandshakePassedFromStores();
    markRuntimeReadyForBs2Link();
  }, [getTelemetryConnSnapshot, markRuntimeReadyForBs2Link]);

  const applyHandshakeFromSimState = useCallback((sim: Bitstream2DevSimStatePayload) => {
    if (useBitstreamTelemetrySourceStore.getState().getEffectiveBackend() !== "simulator") {
      return;
    }
    handlersRef.current.setHandshakeFromBs2?.({
      protocolVersion: sim.version,
      capsFlags: sim.caps,
      statusCounter: 0,
      totalDurationMs: 0,
    });
    handlersRef.current.setHandshakeState?.("passed");
  }, []);

  const syncSimConfigs = useCallback((sim: Bitstream2DevSimStatePayload) => {
    applyHandshakeFromSimState(sim);
    void sim.configs;
    markRuntimeReadyForBs2Link();
    handlersRef.current.onSimConfigsSynced?.();
  }, [applyHandshakeFromSimState, markRuntimeReadyForBs2Link]);

  const applyRuntimeSnapshotHandshake = useCallback((snapshot: BridgeRuntimeSnapshotPayload) => {
    if (snapshot.handshakeState !== "passed") {
      return;
    }
    handlersRef.current.setHandshakeState?.("passed");
    if (snapshot.handshakeLastError != null) {
      useBitstreamLiveStore.getState().setHandshakeLastError(null);
    }
    reconcileBs2HandshakePassedFromStores();
    markRuntimeReadyForBs2Link();
  }, [markRuntimeReadyForBs2Link]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      for (let attempt = 0; attempt < WS_CONNECT_MAX_ATTEMPTS && !cancelled; attempt++) {
        if (useWsClientStore.getState().isConnected) {
          return;
        }
        try {
          await connect();
          return;
        } catch {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, WS_CONNECT_RETRY_MS);
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connect]);

  /** Re-assert route + sim control when WS connects. */
  useEffect(() => {
    if (!isConnected) {
      return;
    }
    const backend = useBitstreamTelemetrySourceStore.getState().backend;
    publishTelemetryRoute(backend);
    if (backend === "simulator") {
      publishDevSimStreamingControl();
    }
    else {
      publishDevSimStreamingIdle();
    }
  }, [isConnected, telemetryBackend]);

  useEffect(() => {
    if (!isConnected) {
      wireRxWindowRef.current?.stop();
      wireRxWindowRef.current = null;
      return;
    }

    const wireRx = new Bs2WireRxWindowAccumulator((stats) => {
      useBitstreamConnectionStore.getState().setSerialRxWireStats(stats);
    });
    wireRxWindowRef.current = wireRx;
    wireRx.start();

    return () => {
      wireRx.stop();
      if (wireRxWindowRef.current === wireRx) {
        wireRxWindowRef.current = null;
      }
    };
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        await subscribeTopic(BITSTREAM2_TOPICS.HELLO, 0, "json");
        await subscribeTopic(BITSTREAM2_TOPICS.EVT_SENSOR, 0, "json");
        await subscribeTopic(BITSTREAM2_TOPICS.RES, 0, "json");
        await subscribeTopic(BITSTREAM2_TOPICS.DEV_STATUS, 0, "json");
        await subscribeTopic(BITSTREAM2_TOPICS.DEV_SIM_STATE, 0, "json");
        await subscribeTopic(BITSTREAM2_TOPICS.DEV_SIM_CONTROL, 0, "json");
        await subscribeTopic(SERIALPORT_TOPICS.STATUS, 0, "json");
        await subscribeTopic(SERIALPORT_TOPICS.RUNTIME_SNAPSHOT, 0, "json");
      } catch {
        // Retry on next connect cycle.
      }
      if (cancelled) {
        return;
      }
      const backend = useBitstreamTelemetrySourceStore.getState().backend;
      if (backend === "uart") {
        publishTelemetryRoute("uart");
        publishDevSimStreamingIdle();
      }
      else {
        publishTelemetryRoute("simulator");
        publishDevSimStreamingControl();
      }
    })();

    const onMessage = (topic: string, payload: unknown) => {
      if (topic === SERIALPORT_TOPICS.STATUS) {
        useBitstreamConnectionStore.getState().setSerialBridgeStatus(
          payload as SerialPortStatusPayload,
        );
        reconcileBs2HandshakePassedFromStores();
        return;
      }

      if (topic === SERIALPORT_TOPICS.RUNTIME_SNAPSHOT) {
        const snapshot = payload as BridgeRuntimeSnapshotPayload;
        useBitstreamConnectionStore.getState().setRuntimeSnapshot(snapshot);
        applyRuntimeSnapshotHandshake(snapshot);
        return;
      }

      if (topic === BITSTREAM2_TOPICS.DEV_STATUS) {
        const dev = payload as Bitstream2DevStatusPayload;
        const loopbackOn =
          dev.loopbackEnabled === true || dev.externalSimOnline === true;
        useBitstreamTelemetrySourceStore.getState().setLoopbackAvailable(loopbackOn);
        if (loopbackOn) {
          const backend = useBitstreamTelemetrySourceStore.getState().backend;
          if (backend === "uart") {
            publishTelemetryRoute("uart");
            publishDevSimStreamingIdle();
          }
          else {
            publishTelemetryRoute("simulator");
            publishDevSimStreamingControl();
          }
        }
        if (loopbackOn && useBitstreamTelemetrySourceStore.getState().backend === "simulator") {
          useBitstreamLiveStore.getState().touchFirmwareRxAt();
        }
        return;
      }

      if (topic === BITSTREAM2_TOPICS.HELLO) {
        noteExternalSimulatorOnline(getTelemetryConnSnapshot());
        applyHello(payload as Bitstream2HelloPayload);
        return;
      }

      if (topic === BITSTREAM2_TOPICS.DEV_SIM_STATE) {
        const backend = useBitstreamTelemetrySourceStore.getState().backend;
        if (backend === "simulator") {
          syncSimConfigs(payload as Bitstream2DevSimStatePayload);
        }
        return;
      }

      if (topic !== BITSTREAM2_TOPICS.EVT_SENSOR) {
        return;
      }

      noteExternalSimulatorOnline(getTelemetryConnSnapshot());

      if (!shouldIngestTelemetry(getTelemetryConnSnapshot())) {
        return;
      }

      const bs2 = payload as Bitstream2SensorSamplePayload;
      if (!shouldAcceptBs2SampleOrigin(bs2)) {
        return;
      }

      wireRxWindowRef.current?.recordEvtSensorPayload(bs2);

      useBitstreamLiveStore.getState().bumpBs2EvtSensorRx();
      const mapped = bs2SampleToBitstreamSensorSampleV2(bs2);
      if (mapped == null) {
        return;
      }

      useBitstreamLiveStore.getState().touchFirmwareRxAt();
      handlersRef.current.onBs2Sample(mapped);

      if (mapped.sourceHint === "bmi270") {
        useBitstreamLiveStore.getState().recordBmi270EvtMask(bs2.mask);
        const nowPerf = performance.now();
        const prev = bmi270LastPerfRef.current;
        if (prev != null) {
          const gap = nowPerf - prev;
          const gaps = bmi270GapsRef.current;
          gaps.push(gap);
          while (gaps.length > BMI270_WIRE_GAP_RING_MAX) {
            gaps.shift();
          }
        }
        bmi270LastPerfRef.current = nowPerf;
      }
    };

    addMessageListener(LISTENER_ID, onMessage);
    return () => {
      cancelled = true;
      removeMessageListener(LISTENER_ID);
    };
  }, [
    addMessageListener,
    applyHello,
    isConnected,
    removeMessageListener,
    subscribeTopic,
    applyHandshakeFromSimState,
    applyRuntimeSnapshotHandshake,
    syncSimConfigs,
    getTelemetryConnSnapshot,
  ]);
}
