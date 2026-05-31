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

export type PalettePrimaryBundleRow =
  | {
      kind: "vector3";
      label: string;
      handleId: string;
      vector: FlowWireVec3;
      fractionDigits: number;
    }
  | {
      kind: "quaternion";
      label: string;
      quaternion: FlowWireQuaternion;
      fractionDigits?: number;
    }
  | {
      kind: "scalar";
      label: string;
      value: number;
      unit?: string;
      fractionDigits?: number;
      signedPositive?: boolean;
      unavailableWhenIdle?: boolean;
    };

export type PalettePreview =
  | { kind: "pulse"; streamMode: PalettePreviewStreamTone; label?: string }
  | { kind: "unavailable"; unit?: string }
  | {
      kind: "primaryBundle";
      streamMode: PalettePreviewStreamTone;
      rows: PalettePrimaryBundleRow[];
    }
  | {
      kind: "scalar";
      streamMode: PalettePreviewStreamTone;
      value: number;
      unit?: string;
      fractionDigits?: number;
      signedPositive?: boolean;
    }
  | {
      kind: "vector3";
      streamMode: PalettePreviewStreamTone;
      vector: FlowWireVec3;
      /** Drives fraction digits (euler → 3 dp). */
      handleId: string;
    }
  | {
      kind: "quaternion";
      streamMode: PalettePreviewStreamTone;
      quaternion: FlowWireQuaternion;
      fractionDigits?: number;
    }
  /** @deprecated Prefer structured scalar / vector3 / quaternion previews. */
  | { kind: "value"; text: string; unit?: string; streamMode: PalettePreviewStreamTone };

type HintMap = MetricsSnapshot["latestByHint"];

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

function scalarPreview(
  n: number,
  unit: string | undefined,
  streamMode: PalettePreviewStreamTone,
  unavailableWhenNotLive = false,
  fractionDigits = 2,
): PalettePreview {
  if (unavailableWhenNotLive && streamMode === "idle" && (!Number.isFinite(n) || n === 0)) {
    return { kind: "unavailable", unit };
  }
  if (!Number.isFinite(n)) {
    return { kind: "unavailable", unit };
  }
  return { kind: "scalar", value: n, unit, streamMode, fractionDigits };
}

function sensorInputPreview(entry: NodeCatalogEntry, latestByHint: HintMap, nowMs: number): PalettePreview {
  const raw = entry.defaultConfig.sourceKey;
  const key =
    typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : "bmi270.accel.x";
  const live = resolveLiveNumericFromLatestByHint(latestByHint, key);
  if (live != null && Number.isFinite(live)) {
    return { kind: "scalar", value: live, streamMode: "live", fractionDigits: 2 };
  }
  const demo = Math.sin(nowMs / 500) * 0.5 + 0.5;
  return { kind: "scalar", value: demo, streamMode: "idle", fractionDigits: 2 };
}

function quatInputAnimatedPreview(nowMs: number): PalettePreview {
  const t = nowMs / 3000;
  const half = t / 2;
  return {
    kind: "quaternion",
    streamMode: "idle",
    quaternion: { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) },
    fractionDigits: 3,
  };
}

function vector3HandleIdForTap(nodeId: string): string {
  switch (nodeId) {
    case "bmi270-tap-euler":
      return "euler";
    case "bmi270-tap-gyro":
      return "gyro";
    case "bmi270-tap-accel":
      return "accel";
    case "bmm350-tap-magnetic":
      return "magnetic";
    default:
      return "vector";
  }
}

function vector3TapPreview(nodeId: string, latestByHint: HintMap): PalettePreview {
  if (nodeId === "bmm350-tap-magnetic") {
    const b = computeBmm350PinBundle(latestByHint);
    return {
      kind: "vector3",
      streamMode: b.streamLive ? "live" : "idle",
      vector: b.magneticUt,
      handleId: "magnetic",
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
    kind: "vector3",
    streamMode: bundle.streamLive ? "live" : "idle",
    vector: v,
    handleId: vector3HandleIdForTap(nodeId),
  };
}

function quaternionTapPreview(latestByHint: HintMap): PalettePreview {
  const bundle = computeBmi270PinBundle(latestByHint);
  return {
    kind: "quaternion",
    streamMode: bundle.streamLive ? "live" : "idle",
    quaternion: bundle.quaternion,
    fractionDigits: 3,
  };
}

function scalarNumberTapPreview(nodeId: string, latestByHint: HintMap): PalettePreview {
  switch (nodeId) {
    case "dps368-tap-pressure": {
      const b = computeDps368PinBundle(latestByHint);
      return scalarPreview(b.pressureHpa, "hPa", b.streamLive ? "live" : "idle");
    }
    case "dps368-tap-temp": {
      const b = computeDps368PinBundle(latestByHint);
      return scalarPreview(b.tempC, "°C", b.streamLive ? "live" : "idle", true);
    }
    case "sht40-tap-humidity": {
      const b = computeSht40PinBundle(latestByHint);
      return scalarPreview(b.humidityPct, "%RH", b.streamLive ? "live" : "idle");
    }
    case "sht40-tap-temp": {
      const b = computeSht40PinBundle(latestByHint);
      return scalarPreview(b.tempC, "°C", b.streamLive ? "live" : "idle", true);
    }
    case "bmm350-tap-temp": {
      const b = computeBmm350PinBundle(latestByHint);
      return scalarPreview(b.tempC, "°C", b.streamLive ? "live" : "idle", true);
    }
    case "bmi270-tap-temp": {
      const b = computeBmi270PinBundle(latestByHint);
      return scalarPreview(b.temp, "°C", b.streamLive ? "live" : "idle", true);
    }
    default:
      return { kind: "unavailable" };
  }
}

function multiOutputPulsePreview(nodeId: string, latestByHint: HintMap): PalettePreview {
  switch (nodeId) {
    case "vector-splitter":
    case "quaternion-splitter":
      return { kind: "pulse", streamMode: "idle", label: "multi" };
    default:
      return { kind: "pulse", streamMode: "idle" };
  }
}

function bmi270PrimaryBundlePreview(latestByHint: HintMap): PalettePreview {
  const b = computeBmi270PinBundle(latestByHint);
  const streamMode = b.streamLive ? "live" : "idle";
  return {
    kind: "primaryBundle",
    streamMode,
    rows: [
      { kind: "vector3", label: "Accel", handleId: "accel", vector: b.accel, fractionDigits: 2 },
      { kind: "vector3", label: "Gyro", handleId: "gyro", vector: b.gyro, fractionDigits: 2 },
      { kind: "vector3", label: "Euler", handleId: "euler", vector: b.euler, fractionDigits: 3 },
      {
        kind: "quaternion",
        label: "Quat",
        quaternion: b.quaternion,
        fractionDigits: 3,
      },
      {
        kind: "scalar",
        label: "Temp",
        value: b.temp,
        unit: "°C",
        fractionDigits: 2,
        signedPositive: false,
        unavailableWhenIdle: true,
      },
    ],
  };
}

function dps368PrimaryBundlePreview(latestByHint: HintMap): PalettePreview {
  const b = computeDps368PinBundle(latestByHint);
  const streamMode = b.streamLive ? "live" : "idle";
  return {
    kind: "primaryBundle",
    streamMode,
    rows: [
      {
        kind: "scalar",
        label: "Pressure",
        value: b.pressureHpa,
        unit: "hPa",
        fractionDigits: 2,
        signedPositive: false,
      },
      {
        kind: "scalar",
        label: "Temp",
        value: b.tempC,
        unit: "°C",
        fractionDigits: 2,
        signedPositive: false,
        unavailableWhenIdle: true,
      },
    ],
  };
}

function sht40PrimaryBundlePreview(latestByHint: HintMap): PalettePreview {
  const b = computeSht40PinBundle(latestByHint);
  const streamMode = b.streamLive ? "live" : "idle";
  return {
    kind: "primaryBundle",
    streamMode,
    rows: [
      {
        kind: "scalar",
        label: "RH",
        value: b.humidityPct,
        unit: "%RH",
        fractionDigits: 2,
        signedPositive: false,
      },
      {
        kind: "scalar",
        label: "Temp",
        value: b.tempC,
        unit: "°C",
        fractionDigits: 2,
        signedPositive: false,
        unavailableWhenIdle: true,
      },
    ],
  };
}

function bmm350PrimaryBundlePreview(latestByHint: HintMap): PalettePreview {
  const b = computeBmm350PinBundle(latestByHint);
  const streamMode = b.streamLive ? "live" : "idle";
  return {
    kind: "primaryBundle",
    streamMode,
    rows: [
      {
        kind: "vector3",
        label: "Mag",
        handleId: "magnetic",
        vector: b.magneticUt,
        fractionDigits: 2,
      },
      {
        kind: "scalar",
        label: "Temp",
        value: b.tempC,
        unit: "°C",
        fractionDigits: 2,
        signedPositive: false,
        unavailableWhenIdle: true,
      },
    ],
  };
}

function primarySensorBundlePreview(nodeId: string, latestByHint: HintMap): PalettePreview {
  switch (nodeId) {
    case "bmi270-input":
      return bmi270PrimaryBundlePreview(latestByHint);
    case "dps368-input":
      return dps368PrimaryBundlePreview(latestByHint);
    case "sht40-input":
      return sht40PrimaryBundlePreview(latestByHint);
    case "bmm350-input":
      return bmm350PrimaryBundlePreview(latestByHint);
    default:
      return multiOutputPulsePreview(nodeId, latestByHint);
  }
}

/**
 * Preview text / pulse / unavailable for a catalog row. Mirrors flow graph live bundles where applicable.
 */
export function computePalettePreview(
  entry: NodeCatalogEntry,
  latestByHint: HintMap,
  nowMs: number,
): PalettePreview {
  const ports = entry.outputPorts;
  if (ports != null && ports.length > 1) {
    return primarySensorBundlePreview(entry.id, latestByHint);
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

  return { kind: "unavailable" };
}
