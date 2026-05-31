/*******************************************************************************
 * File Name : useBitstreamSession.ts
 *
 * Description : Simulator-only Bitstream session: WS connect for BS2 loopback,
 *               live metrics ingest, and local UI state. Serial bridge / UART /
 *               serialport/* broker exchange removed pending redesign.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 2.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useEffect, useRef } from "react";
import type { BitstreamSensorSampleV2 } from "../../../bitstream/events/sensor-decoder.js";
import type {
  Bmi270FusionFeedUpdatedPayload,
  Bmi270StreamModeUpdatedPayload,
  BridgeAccessControlSetPayload,
  BridgeRuntimeSnapshotSensorConfigs,
  RuntimeHandshakeReportPayload,
  SensorCfgUpdatedPayload,
} from "../../../serialport-bridge/protocol";
import { SERIALPORT_TOPICS } from "../../../serialport-bridge/protocol.js";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../constants/sensorSourceIds";
import type { BitstreamSensorSourceHint } from "../../../bitstream/events/sensor-decoder.js";
import { useBitstreamDeviceSensorConfigStore } from "../state/bitstreamDeviceSensorConfig.store";
import { effectiveSensorPublishIntervalMs } from "../utils/sensorPublishInterval.js";
import type { TransportState } from "../state/bitstreamConnection.store";
import {
  getInitialMetrics,
  type MetricsSnapshot,
} from "../state/bitstreamLive.store";
import { useBmi270FusionEulerWireTapStore } from "../state/bmi270FusionEulerWireTap.store.js";
import { useBmi270FusionQuatOrientationStore } from "../state/bmi270FusionQuatOrientation.store.js";
import { useBmi270FusionQuatWireTapStore } from "../state/bmi270FusionQuatWireTap.store.js";
import { useBitstreamLiveStore } from "../state/bitstreamLive.store.js";
import { useBitstreamConnectionStore } from "../state/bitstreamConnection.store.js";
import { useBitstreamTelemetrySourceStore } from "../state/bitstreamTelemetrySource.store.js";
import { openUartPortAndHandshake } from "../bridge/openUartPortAndHandshake.js";
import { releaseOpenSerialPort } from "../bridge/releaseOpenSerialPort.js";
import { useSerialPortStore } from "../../serialport/serial-port-store";
import { useWsClientStore } from "../../ws-client-store.js";
import { appendTelemetryActivity } from "../../sensor-telemetry/store/telemetryActivity.store.js";
import { computeSampleInterArrivalMs } from "../utils/deviceTMsInterArrival.js";
import { updateTelemetryStreamRates } from "../utils/telemetryStreamRate.js";
import { mergePartialBitstreamSensorSample } from "../bridge/bs2-sample-to-live-v2.js";

/** Rolling window of BMI270 inter-arrival gaps for wire-path jitter stats (not UI-throttled). */
const BMI270_WIRE_GAP_RING_MAX = 64;

/** At or below this publish interval (ms), flush live metrics on every sample (no UI coalesce). */
const IMMEDIATE_UI_FLUSH_PUBLISH_MS = 200;

function sourceHintToLegacySourceId(hint: BitstreamSensorSourceHint): number | null {
  switch (hint) {
    case "bmi270":
      return SENSOR_SOURCE_ID_BMI270;
    case "bmm350":
      return SENSOR_SOURCE_ID_BMM350;
    case "sht40":
      return SENSOR_SOURCE_ID_SHT40;
    case "dps368":
      return SENSOR_SOURCE_ID_DPS368;
    default:
      return null;
  }
}

/** Merge partial BS2 BMI270 EVT rows (mask subsets) into one live sample. */
function mergeLatestSensorSample(
  prev: BitstreamSensorSampleV2 | null,
  incoming: BitstreamSensorSampleV2,
): BitstreamSensorSampleV2 {
  return mergePartialBitstreamSensorSample(prev, incoming);
}

function createSensorCfgBroadcastInstanceToken(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `bcf-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function isSimulatorConnectPath(): boolean {
  return useBitstreamTelemetrySourceStore.getState().backend === "simulator";
}

interface UseBitstreamSessionParams {
  uiFlushIntervalMs: number;
  connecting?: boolean;
  connected?: boolean;
  setConnecting: (value: boolean) => void;
  setConnected: (value: boolean) => void;
  setTransportState: (value: TransportState) => void;
  setBusyAction: (value: string | null) => void;
  setBackendWsState?: (
    value:
      | "disconnected"
      | "connecting"
      | "connected"
      | "reconnecting"
      | "error",
  ) => void;
  setRuntimeSyncState?: (value: "idle" | "syncing_snapshot" | "ready") => void;
  pushLog: (message: string) => void;
  applyMetricsSnapshot: (snapshot: MetricsSnapshot) => void;
  resetLiveData: () => void;
  /** When true, connect simulator WS on mount when backend is Simulator. */
  autoOrchestrate?: boolean;
}

export function useBitstreamSession(params: UseBitstreamSessionParams) {
  const {
    uiFlushIntervalMs,
    connecting = false,
    connected = false,
    setConnecting,
    setConnected,
    setTransportState,
    setBusyAction,
    setBackendWsState,
    setRuntimeSyncState,
    pushLog,
    applyMetricsSnapshot,
    resetLiveData,
    autoOrchestrate = false,
  } = params;

  const setBackendWsStateSafe = useCallback(
    (
      value:
        | "disconnected"
        | "connecting"
        | "connected"
        | "reconnecting"
        | "error",
    ) => {
      setBackendWsState?.(value);
    },
    [setBackendWsState],
  );

  const setRuntimeSyncStateSafe = useCallback(
    (value: "idle" | "syncing_snapshot" | "ready") => {
      setRuntimeSyncState?.(value);
    },
    [setRuntimeSyncState],
  );

  const sensorCfgBroadcastInstanceTokenRef = useRef<string>(
    createSensorCfgBroadcastInstanceToken(),
  );
  const manualDisconnectRef = useRef(false);
  const uiFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metricsRef = useRef<MetricsSnapshot>(getInitialMetrics());
  const bmi270WireStatsRef = useRef<{
    lastArrivalPerf: number | null;
    gaps: number[];
    packetsSinceFlush: number;
  }>({
    lastArrivalPerf: null,
    gaps: [],
    packetsSinceFlush: 0,
  });
  const hostGapRingsByHintRef = useRef<Partial<Record<BitstreamSensorSourceHint, number[]>>>({});
  const connectInFlightRef = useRef(false);
  const connectedRef = useRef(connected);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  const clearUiFlushTimer = useCallback(() => {
    if (!uiFlushTimerRef.current) {
      return;
    }
    clearTimeout(uiFlushTimerRef.current);
    uiFlushTimerRef.current = null;
  }, []);

  const finalizeBmi270WireDiagBeforeFlush = useCallback(() => {
    const st = bmi270WireStatsRef.current;
    const { gaps, packetsSinceFlush } = st;
    let meanGapMs: number | null = null;
    let jitterStdMs: number | null = null;
    let wireHzFromGaps: number | null = null;
    if (gaps.length > 0) {
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      meanGapMs = mean;
      wireHzFromGaps = mean > 0 ? 1000 / mean : null;
      if (gaps.length >= 2) {
        const variance =
          gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length;
        jitterStdMs = Math.sqrt(variance);
      }
      else {
        jitterStdMs = 0;
      }
    }
    metricsRef.current.bmi270WireDiag = {
      meanGapMs,
      jitterStdMs,
      wireHzFromGaps,
      samplesCoalescedLastFlush: packetsSinceFlush,
    };
    st.packetsSinceFlush = 0;
  }, []);

  const flushMetricsToUi = useCallback(() => {
    finalizeBmi270WireDiagBeforeFlush();
    useBitstreamLiveStore.getState().bumpUiFlushApplied();
    applyMetricsSnapshot({ ...metricsRef.current });
  }, [applyMetricsSnapshot, finalizeBmi270WireDiagBeforeFlush]);

  /** Throttled UI refresh: leading flush for low latency, trailing flush to coalesce bursts. */
  const scheduleMetricsFlush = useCallback(() => {
    if (uiFlushTimerRef.current) {
      return;
    }
    flushMetricsToUi();
    uiFlushTimerRef.current = setTimeout(() => {
      uiFlushTimerRef.current = null;
      flushMetricsToUi();
    }, uiFlushIntervalMs);
  }, [flushMetricsToUi, uiFlushIntervalMs]);

  const applySensorSampleToMetrics = useCallback(
    (sample: BitstreamSensorSampleV2) => {
      const hint = sample.sourceHint;
      const nowMs = Date.now();
      const prevAt = metricsRef.current.lastAtByHint[hint];
      const prevLatest = metricsRef.current.latestByHint[hint];
      const interArrivalMs = computeSampleInterArrivalMs({
        sample,
        prevLatest,
        prevWallAtMs: prevAt,
        prevInterArrivalMs: metricsRef.current.lastDeltaMsByHint[hint],
        nowMs,
      });
      const hostInterArrivalMs = prevAt != null ? nowMs - prevAt : null;
      const mergedLatest = mergeLatestSensorSample(prevLatest, sample);

      metricsRef.current.sampleCount += 1;
      metricsRef.current.latestByHint = {
        ...metricsRef.current.latestByHint,
        [hint]: mergedLatest,
      };
      metricsRef.current.lastAtByHint = {
        ...metricsRef.current.lastAtByHint,
        [hint]: nowMs,
      };
      metricsRef.current.lastDeltaMsByHint = {
        ...metricsRef.current.lastDeltaMsByHint,
        [hint]: interArrivalMs,
      };
      metricsRef.current.lastHostInterArrivalMsByHint = {
        ...metricsRef.current.lastHostInterArrivalMsByHint,
        [hint]: hostInterArrivalMs,
      };

      const hostGapRing = hostGapRingsByHintRef.current[hint] ?? [];
      const rateUpdate = updateTelemetryStreamRates({
        hint,
        interArrivalMs,
        hostInterArrivalMs,
        prevCounter: prevLatest?.counter,
        nextCounter: sample.counter,
        streamHzDeviceByHint: metricsRef.current.streamHzDeviceByHint,
        streamHzHostByHint: metricsRef.current.streamHzHostByHint,
        streamHzCounterByHint: metricsRef.current.streamHzCounterByHint,
        streamHzSmoothedByHint: metricsRef.current.streamHzSmoothedByHint,
        hostGapRing,
      });
      hostGapRingsByHintRef.current[hint] = rateUpdate.hostGapRing;
      metricsRef.current.streamHzDeviceByHint = rateUpdate.streamHzDeviceByHint;
      metricsRef.current.streamHzHostByHint = rateUpdate.streamHzHostByHint;
      metricsRef.current.streamHzCounterByHint = rateUpdate.streamHzCounterByHint;
      metricsRef.current.streamHzSmoothedByHint = rateUpdate.streamHzSmoothedByHint;

      metricsRef.current.frameCountByHint = {
        ...metricsRef.current.frameCountByHint,
        [hint]: (metricsRef.current.frameCountByHint[hint] ?? 0) + 1,
      };
      if (hint === "bmi270") {
        const st = bmi270WireStatsRef.current;
        const nowPerf = performance.now();
        const prev = st.lastArrivalPerf;
        if (prev != null) {
          const gap = nowPerf - prev;
          st.gaps.push(gap);
          while (st.gaps.length > BMI270_WIRE_GAP_RING_MAX) {
            st.gaps.shift();
          }
        }
        st.lastArrivalPerf = nowPerf;
        st.packetsSinceFlush += 1;
        useBmi270FusionQuatOrientationStore.getState().pushFromWireSample(mergedLatest);
        useBmi270FusionQuatWireTapStore.getState().pushFromWireSample(mergedLatest);
        useBmi270FusionEulerWireTapStore.getState().pushFromWireSample(mergedLatest);
      }

      let immediateFlush = false;
      const legacySourceId = sourceHintToLegacySourceId(hint);
      if (legacySourceId != null) {
        const row = useBitstreamDeviceSensorConfigStore.getState().bySourceId[legacySourceId];
        if (row != null) {
          const publishMs = effectiveSensorPublishIntervalMs(
            row.samplingIntervalMs,
            row.publishIntervalMs,
          );
          immediateFlush = publishMs > 0 && publishMs <= IMMEDIATE_UI_FLUSH_PUBLISH_MS;
        }
      }

      if (immediateFlush) {
        flushMetricsToUi();
      }
      else {
        scheduleMetricsFlush();
      }
    },
    [flushMetricsToUi, scheduleMetricsFlush],
  );

  const resetLiveDataState = useCallback(() => {
    clearUiFlushTimer();
    metricsRef.current = getInitialMetrics();
    bmi270WireStatsRef.current = {
      lastArrivalPerf: null,
      gaps: [],
      packetsSinceFlush: 0,
    };
    hostGapRingsByHintRef.current = {};
    useBmi270FusionQuatOrientationStore.getState().reset();
    useBmi270FusionQuatWireTapStore.getState().reset();
    useBmi270FusionEulerWireTapStore.getState().reset();
    resetLiveData();
  }, [clearUiFlushTimer, resetLiveData]);

  const collapseDisconnectedState = useCallback(
    (resetLiveMetrics: boolean) => {
      setConnected(false);
      setTransportState("disconnected");
      setBackendWsStateSafe("disconnected");
      setRuntimeSyncStateSafe("idle");
      if (resetLiveMetrics) {
        resetLiveDataState();
      }
    },
    [
      resetLiveDataState,
      setBackendWsStateSafe,
      setConnected,
      setRuntimeSyncStateSafe,
      setTransportState,
    ],
  );

  const runAction = useCallback(
    async (name: string, action: () => Promise<void>) => {
      setBusyAction(name);
      try {
        await action();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        pushLog(`${name} failed: ${message}`);
        appendTelemetryActivity({ text: `${name} failed — ${message}`, tone: "error" });
        if (/not connected|disconnected/i.test(message)) {
          collapseDisconnectedState(true);
        }
      } finally {
        setBusyAction(null);
      }
    },
    [collapseDisconnectedState, pushLog, setBusyAction],
  );

  const requireConnectedSession = useCallback((_actionName: string): null => {
    return null;
  }, []);

  const disconnectSession = useCallback(
    async (options?: { userInitiated?: boolean; preserveLiveTelemetry?: boolean }) => {
      const userInitiated = options?.userInitiated === true;
      if (userInitiated) {
        manualDisconnectRef.current = true;
        useBitstreamConnectionStore.getState().setUserPausedLink(true);
        useBitstreamTelemetrySourceStore.setState({
          uartAwaitingReplug: false,
          uartBringUpPending: false,
        });
      }
      await releaseOpenSerialPort();
      try {
        await useWsClientStore.getState().disconnect();
      } catch {
        // Ignore WS disconnect errors during teardown.
      }
      const resetLive =
        options?.preserveLiveTelemetry !== true &&
        (userInitiated || options?.preserveLiveTelemetry === false);
      collapseDisconnectedState(resetLive);
      pushLog("Simulator session disconnected");
    },
    [collapseDisconnectedState, pushLog],
  );

  const connectSimulatorSession = useCallback(async () => {
    const simulatorPath = isSimulatorConnectPath();

    setConnecting(true);
    try {
      const ws = useWsClientStore.getState();
      if (ws.isConnected)
      {
        manualDisconnectRef.current = false;
        setConnected(true);
        setTransportState("connected");
        setBackendWsStateSafe("connected");
      }
      await ws.connect();
      manualDisconnectRef.current = false;
      setConnected(true);
      setTransportState("connected");
      setBackendWsStateSafe("connected");
      setRuntimeSyncStateSafe("ready");
      if (simulatorPath) {
        const loopback = useBitstreamTelemetrySourceStore.getState().loopbackAvailable;
        appendTelemetryActivity({
          text: loopback
            ? "Simulator connected (sample data via loopback)"
            : "Service connected — enable simulator loopback on the bridge for sample data",
          tone: loopback ? "ok" : "warning",
        });
        pushLog(
          loopback
            ? "Simulator: WebSocket connected (BS2 loopback telemetry via bitstream2/*)"
            : "Simulator: WebSocket connected — start bitstream-simulator extension + bridge for sample streams",
        );
      } else {
        pushLog(
          "WebSocket connected (control plane). UART telemetry ingest is disabled in the main shell; use Sensor Lab tools / CLI, and ensure the serial bridge has an open COM session.",
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      pushLog(`Simulator connect failed: ${message}`);
      appendTelemetryActivity({
        text: `Connection failed — ${message}`,
        tone: "error",
      });
      collapseDisconnectedState(true);
    } finally {
      setConnecting(false);
    }
  }, [
    collapseDisconnectedState,
    pushLog,
    setBackendWsStateSafe,
    setConnected,
    setConnecting,
    setRuntimeSyncStateSafe,
    setTransportState,
  ]);

  const connectSession = useCallback(
    async (
      _serialPathOverride?: string,
      options?: {
        userInitiated?: boolean;
        preserveLiveTelemetry?: boolean;
        /** Run list → open → PING (e.g. after Simulator or stale COM). */
        forceUartFullBringUp?: boolean;
      },
    ) => {
      if (options?.userInitiated === true) {
        manualDisconnectRef.current = false;
        useBitstreamConnectionStore.getState().setUserPausedLink(false);
      }

      const telemetryStore = useBitstreamTelemetrySourceStore.getState();
      const uartMode = telemetryStore.backend === "uart";
      const serialOpen =
        useSerialPortStore.getState().status?.isOpen === true;
      const forceUartFullBringUp =
        options?.forceUartFullBringUp === true ||
        telemetryStore.consumeUartBringUpPending();
      const needsUartLink =
        uartMode && (!serialOpen || forceUartFullBringUp);

      if (connectedRef.current && !needsUartLink) {
        return;
      }
      if (connectInFlightRef.current) {
        return;
      }
      connectInFlightRef.current = true;
      try {
        if (!connectedRef.current) {
          await connectSimulatorSession();
        }
        if (uartMode) {
          await openUartPortAndHandshake({ forceFullBringUp: forceUartFullBringUp });
        }
      } finally {
        connectInFlightRef.current = false;
      }
    },
    [connectSimulatorSession],
  );

  const resetTelemetryDecodePipeline = useCallback((): boolean => {
    resetLiveDataState();
    return true;
  }, [resetLiveDataState]);

  useEffect(() => {
    if (!autoOrchestrate) {
      return;
    }
    if (manualDisconnectRef.current) {
      return;
    }
    if (!isSimulatorConnectPath()) {
      return;
    }
    if (connectedRef.current || connecting) {
      return;
    }
    void connectSimulatorSession();
  }, [autoOrchestrate, connectSimulatorSession, connecting]);

  useEffect(() => {
    return () => {
      clearUiFlushTimer();
    };
  }, [clearUiFlushTimer]);

  const noopPublish = useCallback(() => {
    /* optional fan-out topics without payload */
  }, []);

  const publishSensorCfgUpdated = useCallback((payload: SensorCfgUpdatedPayload) => {
    const { isConnected, publish } = useWsClientStore.getState();
    if (!isConnected)
    {
      return;
    }
    const withToken: SensorCfgUpdatedPayload = {
      ...payload,
      instanceToken: sensorCfgBroadcastInstanceTokenRef.current,
    };
    void publish(SERIALPORT_TOPICS.SENSOR_CFG_UPDATED, withToken, 0).catch(() => {
      /* optional fan-out; ignore publish failures */
    });
  }, []);

  const publishBmi270StreamModeUpdated = useCallback(
    (payload: Omit<Bmi270StreamModeUpdatedPayload, "instanceToken">) => {
      const { isConnected, publish } = useWsClientStore.getState();
      if (!isConnected)
      {
        return;
      }
      const withToken: Bmi270StreamModeUpdatedPayload = {
        ...payload,
        instanceToken: sensorCfgBroadcastInstanceTokenRef.current,
      };
      void publish(SERIALPORT_TOPICS.BMI270_STREAM_MODE_UPDATED, withToken, 0).catch(() => {
        /* optional fan-out; ignore publish failures */
      });
    },
    [],
  );

  const publishBmi270FusionFeedUpdated = useCallback(
    (payload: Omit<Bmi270FusionFeedUpdatedPayload, "instanceToken">) => {
      const { isConnected, publish } = useWsClientStore.getState();
      if (!isConnected)
      {
        return;
      }
      const withToken: Bmi270FusionFeedUpdatedPayload = {
        ...payload,
        instanceToken: sensorCfgBroadcastInstanceTokenRef.current,
      };
      void publish(SERIALPORT_TOPICS.BMI270_FUSION_FEED_UPDATED, withToken, 0).catch(() => {
        /* optional fan-out; ignore publish failures */
      });
    },
    [],
  );

  return {
    connectSession,
    connectSimulatorSession,
    ingestSensorSample: applySensorSampleToMetrics,
    detectPorts: async () => {
      pushLog("Serial port list: removed (pending serial bridge redesign)");
    },
    disconnectSession,
    resetTelemetryDecodePipeline,
    requireConnectedSession,
    runAction,
    actorToken: sensorCfgBroadcastInstanceTokenRef.current,
    publishSensorCfgUpdated,
    publishBmi270StreamModeUpdated,
    publishBmi270FusionFeedUpdated,
    publishRuntimeSnapshotWithSensorConfigs: (
      _sensorConfigs: BridgeRuntimeSnapshotSensorConfigs,
    ) => {
      noopPublish();
    },
    publishRuntimeHandshakeReport: (_report: RuntimeHandshakeReportPayload) => {
      noopPublish();
    },
    publishAccessControlSet: (_payload: BridgeAccessControlSetPayload) => {
      noopPublish();
    },
  };
}
