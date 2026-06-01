import type { BitstreamSensorSampleV2, BitstreamSensorSourceHint } from "../../../bitstream/index";
import {
  inferSensorTelemetryHintFromSourceKey,
  resolveLiveNumericFromLatestByHint,
} from "../../../sensor-studio/core/live/resolve-sensor-source-key.js";
import {
  SENSOR_HEALTH_FALLBACK_LIVE_MAX_AGE_MS,
  SENSOR_HEALTH_FALLBACK_STALE_MAX_AGE_MS,
} from "../../../sensor-studio/core/device/sensor-health-thresholds.js";
import type { HandshakeLifecycleState } from "../../state/bitstreamLive.store.js";
import {
  evaluateTwinSignalHealth,
  worstTwinHealth,
} from "./animation-lab-twin-health.js";
import type {
  AnimationLabDigitalTwinDef,
  AnimationLabTwinComponentLive,
  AnimationLabTwinDataSource,
  AnimationLabTwinHealth,
  AnimationLabTwinMachineSummary,
  AnimationLabTwinSignalDef,
} from "./digital-twin.types.js";

const LIVE_RX_MAX_AGE_MS = 5000;

export function isAnimationLabTwinLiveTelemetryActive(args: {
  connected: boolean;
  handshakeState: HandshakeLifecycleState;
  bs2EvtSensorLastRxAtMs: number | null;
  firmwareLastRxAtMs: number | null;
  nowMs: number;
}): boolean {
  if (!args.connected || args.handshakeState !== "passed") {
    return false;
  }
  const lastRx = args.bs2EvtSensorLastRxAtMs ?? args.firmwareLastRxAtMs;
  if (lastRx == null) {
    return false;
  }
  return args.nowMs - lastRx < LIVE_RX_MAX_AGE_MS;
}

export function resolveAnimationLabTwinLiveNumeric(
  latestByHint: Record<BitstreamSensorSourceHint, BitstreamSensorSampleV2 | null>,
  liveSourceKey: string,
): number | null {
  const key = liveSourceKey.trim();
  if (key === "bmi270.accel.magnitude") {
    const x = resolveLiveNumericFromLatestByHint(latestByHint, "bmi270.accel.x");
    const y = resolveLiveNumericFromLatestByHint(latestByHint, "bmi270.accel.y");
    const z = resolveLiveNumericFromLatestByHint(latestByHint, "bmi270.accel.z");
    if (x == null || y == null || z == null) {
      return null;
    }
    return Math.sqrt(x * x + y * y + z * z);
  }
  return resolveLiveNumericFromLatestByHint(latestByHint, key);
}

function streamAgeHealth(nowMs: number, lastAtMs: number | null): AnimationLabTwinHealth {
  if (lastAtMs == null) {
    return "offline";
  }
  const ageMs = nowMs - lastAtMs;
  if (ageMs > SENSOR_HEALTH_FALLBACK_STALE_MAX_AGE_MS) {
    return "offline";
  }
  if (ageMs > SENSOR_HEALTH_FALLBACK_LIVE_MAX_AGE_MS) {
    return "caution";
  }
  return "ok";
}

function findSignalDef(
  twin: AnimationLabDigitalTwinDef,
  componentId: string,
  signalKey: string,
): AnimationLabTwinSignalDef | null {
  const component = twin.components.find((c) => c.id === componentId);
  if (component == null) {
    return null;
  }
  return component.signals.find((s) => s.key === signalKey) ?? null;
}

function rebuildSummary(
  components: AnimationLabTwinComponentLive[],
  nowMs: number,
): AnimationLabTwinMachineSummary {
  let summaryHealth: AnimationLabTwinHealth = "ok";
  let activeAlertCount = 0;
  for (const c of components) {
    summaryHealth = worstTwinHealth(summaryHealth, c.health);
    if (c.health === "warning" || c.health === "error") {
      activeAlertCount += 1;
    }
  }
  const summaryLabel =
    summaryHealth === "ok"
      ? "Operational"
      : summaryHealth === "caution"
        ? "Nominal — watch list"
        : summaryHealth === "warning"
          ? "Degraded"
          : summaryHealth === "error"
            ? "Fault — inspect now"
            : "Offline";

  return {
    health: summaryHealth,
    label: summaryLabel,
    activeAlertCount,
    updatedAtMs: nowMs,
  };
}

function resolveDataSource(args: {
  liveActive: boolean;
  mappedCount: number;
  liveFilledCount: number;
}): AnimationLabTwinDataSource {
  if (!args.liveActive || args.mappedCount === 0) {
    return "simulated";
  }
  if (args.liveFilledCount >= args.mappedCount) {
    return "live";
  }
  if (args.liveFilledCount > 0) {
    return "mixed";
  }
  return "simulated";
}

export function mergeAnimationLabTwinWithLive(args: {
  twin: AnimationLabDigitalTwinDef;
  simulated: {
    components: AnimationLabTwinComponentLive[];
    summary: AnimationLabTwinMachineSummary;
  };
  latestByHint: Record<BitstreamSensorSourceHint, BitstreamSensorSampleV2 | null>;
  lastAtByHint: Record<BitstreamSensorSourceHint, number | null>;
  nowMs: number;
  liveActive: boolean;
}): {
  components: AnimationLabTwinComponentLive[];
  summary: AnimationLabTwinMachineSummary;
  dataSource: AnimationLabTwinDataSource;
} {
  const { twin, simulated, latestByHint, lastAtByHint, nowMs, liveActive } = args;

  if (!liveActive) {
    return { ...simulated, dataSource: "simulated" };
  }

  let mappedCount = 0;
  let liveFilledCount = 0;

  const components = simulated.components.map((component) => {
    const signals = component.signals.map((signal) => {
      const def = findSignalDef(twin, component.id, signal.key);
      const liveKey = def?.liveSourceKey?.trim();
      if (liveKey == null || liveKey.length === 0 || def == null) {
        return signal;
      }

      mappedCount += 1;
      const liveValue = resolveAnimationLabTwinLiveNumeric(latestByHint, liveKey);
      if (liveValue == null) {
        return signal;
      }

      liveFilledCount += 1;
      const hint = inferSensorTelemetryHintFromSourceKey(liveKey);
      const lastAt = hint != null ? lastAtByHint[hint] : null;
      const valueHealth = evaluateTwinSignalHealth(liveValue, def);
      const ageHealth = streamAgeHealth(nowMs, lastAt);
      const health =
        ageHealth === "ok" ? valueHealth : worstTwinHealth(valueHealth, ageHealth);

      return {
        ...signal,
        value: liveValue,
        health,
      };
    });

    let health: AnimationLabTwinHealth = "ok";
    for (const s of signals) {
      health = worstTwinHealth(health, s.health);
    }

    return { ...component, signals, health };
  });

  return {
    components,
    summary: rebuildSummary(components, nowMs),
    dataSource: resolveDataSource({ liveActive, mappedCount, liveFilledCount }),
  };
}

export function animationLabTwinDataSourceCaption(source: AnimationLabTwinDataSource): string {
  switch (source) {
    case "live":
      return "Live BS2 telemetry · 3D tags on viewport toolbar";
    case "mixed":
      return "Mixed live + simulated · 3D tags on viewport toolbar";
    default:
      return "Simulated · 3D tags on viewport toolbar";
  }
}
