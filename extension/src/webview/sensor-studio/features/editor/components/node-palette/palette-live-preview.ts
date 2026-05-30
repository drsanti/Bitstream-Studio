import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { computeBmi270PinBundle } from "../../../../core/live/bmi270-pin-bundle";
import {
  computeBmm350PinBundle,
  computeDps368PinBundle,
  computeSht40PinBundle,
} from "../../../../core/live/environment-sensors-live-ports";
import type { FlowWireQuaternion, FlowWireVec3 } from "../../../../core/live/flow-wire-types";
import { resolveLiveNumericFromLatestByHint } from "../../../../core/live/resolve-sensor-source-key";
import type { MetricsSnapshot } from "../../../../../bitstream-app/state/bitstreamLive.store";

export type PalettePreviewStreamTone = "live" | "idle";

export type PalettePreview =
  | { kind: "value"; text: string; streamMode: PalettePreviewStreamTone }
  | { kind: "pulse"; streamMode: PalettePreviewStreamTone }
  | { kind: "dash" };

type HintMap = MetricsSnapshot["latestByHint"];

function vecMag(v: FlowWireVec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/** Rotation angle (degrees) from quaternion (same construction as common atan2 formulation). */
export function quatRotationDeg(q: FlowWireQuaternion): number {
  const sinHalf = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z);
  const thetaRad = 2 * Math.atan2(sinHalf, q.w);
  return (thetaRad * 180) / Math.PI;
}

export function formatPaletteScalar(n: number): string {
  if (!Number.isFinite(n)) {
    return "—";
  }
  const a = Math.abs(n);
  if (a >= 1000 || (a > 0 && a < 0.01)) {
    return n.toExponential(2);
  }
  if (a >= 100) {
    return n.toFixed(1);
  }
  if (a >= 10) {
    return n.toFixed(2);
  }
  return n.toFixed(3);
}

function sensorInputPreview(entry: NodeCatalogEntry, latestByHint: HintMap, nowMs: number): PalettePreview {
  const raw = entry.defaultConfig.sourceKey;
  const key =
    typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : "bmi270.accel.x";
  const live = resolveLiveNumericFromLatestByHint(latestByHint, key);
  if (live != null && Number.isFinite(live)) {
    return { kind: "value", text: formatPaletteScalar(live), streamMode: "live" };
  }
  const demo = Math.sin(nowMs / 500) * 0.5 + 0.5;
  return { kind: "value", text: formatPaletteScalar(demo), streamMode: "idle" };
}

function quatInputAnimatedPreview(nowMs: number): PalettePreview {
  const t = nowMs / 3000;
  const half = t / 2;
  const q: FlowWireQuaternion = { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) };
  return {
    kind: "value",
    text: `${quatRotationDeg(q).toFixed(1)}°`,
    streamMode: "idle",
  };
}

function vector3TapPreview(nodeId: string, latestByHint: HintMap): PalettePreview {
  if (nodeId === "bmm350-tap-magnetic") {
    const b = computeBmm350PinBundle(latestByHint);
    return {
      kind: "value",
      text: formatPaletteScalar(vecMag(b.magneticUt)),
      streamMode: b.streamLive ? "live" : "idle",
    };
  }
  const bundle = computeBmi270PinBundle(latestByHint);
  let v: FlowWireVec3;
  switch (nodeId) {
    case "bmi270-tap-gyro":
      v = bundle.gyro;
      break;
    case "bmi270-tap-euler":
      v = bundle.euler;
      break;
    case "bmi270-tap-accel":
    default:
      v = bundle.accel;
      break;
  }
  return {
    kind: "value",
    text: formatPaletteScalar(vecMag(v)),
    streamMode: bundle.streamLive ? "live" : "idle",
  };
}

function quaternionTapPreview(latestByHint: HintMap): PalettePreview {
  const bundle = computeBmi270PinBundle(latestByHint);
  return {
    kind: "value",
    text: `${quatRotationDeg(bundle.quaternion).toFixed(1)}°`,
    streamMode: bundle.streamLive ? "live" : "idle",
  };
}

function scalarNumberTapPreview(nodeId: string, latestByHint: HintMap): PalettePreview {
  switch (nodeId) {
    case "dps368-tap-pressure": {
      const b = computeDps368PinBundle(latestByHint);
      return {
        kind: "value",
        text: formatPaletteScalar(b.pressureHpa),
        streamMode: b.streamLive ? "live" : "idle",
      };
    }
    case "dps368-tap-temp": {
      const b = computeDps368PinBundle(latestByHint);
      return {
        kind: "value",
        text: formatPaletteScalar(b.tempC),
        streamMode: b.streamLive ? "live" : "idle",
      };
    }
    case "sht40-tap-humidity": {
      const b = computeSht40PinBundle(latestByHint);
      return {
        kind: "value",
        text: formatPaletteScalar(b.humidityPct),
        streamMode: b.streamLive ? "live" : "idle",
      };
    }
    case "sht40-tap-temp": {
      const b = computeSht40PinBundle(latestByHint);
      return {
        kind: "value",
        text: formatPaletteScalar(b.tempC),
        streamMode: b.streamLive ? "live" : "idle",
      };
    }
    case "bmm350-tap-temp": {
      const b = computeBmm350PinBundle(latestByHint);
      return {
        kind: "value",
        text: formatPaletteScalar(b.tempC),
        streamMode: b.streamLive ? "live" : "idle",
      };
    }
    default:
      return { kind: "dash" };
  }
}

function multiOutputPulsePreview(nodeId: string, latestByHint: HintMap): PalettePreview {
  switch (nodeId) {
    case "bmi270-input":
      return {
        kind: "pulse",
        streamMode: computeBmi270PinBundle(latestByHint).streamLive ? "live" : "idle",
      };
    case "dps368-input":
      return {
        kind: "pulse",
        streamMode: computeDps368PinBundle(latestByHint).streamLive ? "live" : "idle",
      };
    case "sht40-input":
      return {
        kind: "pulse",
        streamMode: computeSht40PinBundle(latestByHint).streamLive ? "live" : "idle",
      };
    case "bmm350-input":
      return {
        kind: "pulse",
        streamMode: computeBmm350PinBundle(latestByHint).streamLive ? "live" : "idle",
      };
    case "vector-splitter":
    case "quaternion-splitter":
      return { kind: "pulse", streamMode: "idle" };
    default:
      return { kind: "pulse", streamMode: "idle" };
  }
}

/**
 * Preview text / pulse / dash for a catalog row. Mirrors flow graph live bundles where applicable.
 */
export function computePalettePreview(
  entry: NodeCatalogEntry,
  latestByHint: HintMap,
  nowMs: number,
): PalettePreview {
  const ports = entry.outputPorts;
  if (ports != null && ports.length > 1) {
    return multiOutputPulsePreview(entry.id, latestByHint);
  }

  if (entry.id === "sensor-input") {
    return sensorInputPreview(entry, latestByHint, nowMs);
  }
  if (entry.id === "quat-input") {
    return quatInputAnimatedPreview(nowMs);
  }

  if (ports != null && ports.length === 1) {
    const pt = ports[0].portType;
    if (pt === "number") {
      return scalarNumberTapPreview(entry.id, latestByHint);
    }
    if (pt === "vector3") {
      return vector3TapPreview(entry.id, latestByHint);
    }
    if (pt === "quaternion") {
      return quaternionTapPreview(latestByHint);
    }
  }

  return { kind: "dash" };
}
