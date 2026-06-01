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
import {
  PALETTE_ACCEL_ROW_LABEL,
  PALETTE_EULER_ROW_LABEL,
  PALETTE_GYRO_ROW_LABEL,
  PALETTE_HUMIDITY_ROW_LABEL,
  PALETTE_MAGNETIC_ROW_LABEL,
  PALETTE_PRESSURE_ROW_LABEL,
  PALETTE_QUATERNION_ROW_LABEL,
  PALETTE_TEMPERATURE_ROW_LABEL,
} from "../../../../core/sensor-port-labels";

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

function paletteVector3RowLabel(nodeId: string): string {
  switch (nodeId) {
    case "bmi270-tap-euler":
      return PALETTE_EULER_ROW_LABEL;
    case "bmi270-tap-gyro":
      return PALETTE_GYRO_ROW_LABEL;
    case "bmi270-tap-accel":
      return PALETTE_ACCEL_ROW_LABEL;
    case "bmm350-tap-magnetic":
      return PALETTE_MAGNETIC_ROW_LABEL;
    default:
      return "Vector";
  }
}

function vector3TapPrimaryBundlePreview(
  nodeId: string,
  vector: FlowWireVec3,
  streamLive: boolean,
): PalettePreview {
  const handleId = vector3HandleIdForTap(nodeId);
  return {
    kind: "primaryBundle",
    streamMode: streamLive ? "live" : "idle",
    rows: [
      {
        kind: "vector3",
        label: paletteVector3RowLabel(nodeId),
        handleId,
        vector,
        fractionDigits: handleId === "euler" ? 3 : 2,
      },
    ],
  };
}

function vector3TapPreview(nodeId: string, latestByHint: HintMap): PalettePreview {
  if (nodeId === "bmm350-tap-magnetic") {
    const b = computeBmm350PinBundle(latestByHint);
    return vector3TapPrimaryBundlePreview(nodeId, b.magneticUt, b.streamLive);
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
  return vector3TapPrimaryBundlePreview(nodeId, v, bundle.streamLive);
}

function quaternionTapPrimaryBundlePreview(
  quaternion: FlowWireQuaternion,
  streamLive: boolean,
): PalettePreview {
  return {
    kind: "primaryBundle",
    streamMode: streamLive ? "live" : "idle",
    rows: [
      {
        kind: "quaternion",
        label: PALETTE_QUATERNION_ROW_LABEL,
        quaternion,
        fractionDigits: 3,
      },
    ],
  };
}

function quaternionTapPreview(latestByHint: HintMap): PalettePreview {
  const bundle = computeBmi270PinBundle(latestByHint);
  return quaternionTapPrimaryBundlePreview(bundle.quaternion, bundle.streamLive);
}

function temperatureTapPrimaryBundlePreview(
  tempC: number,
  streamLive: boolean,
): PalettePreview {
  return {
    kind: "primaryBundle",
    streamMode: streamLive ? "live" : "idle",
    rows: [
      {
        kind: "scalar",
        label: PALETTE_TEMPERATURE_ROW_LABEL,
        value: tempC,
        fractionDigits: 2,
        signedPositive: false,
        unavailableWhenIdle: true,
      },
    ],
  };
}

function pressureTapPrimaryBundlePreview(
  pressureHpa: number,
  streamLive: boolean,
): PalettePreview {
  return {
    kind: "primaryBundle",
    streamMode: streamLive ? "live" : "idle",
    rows: [
      {
        kind: "scalar",
        label: PALETTE_PRESSURE_ROW_LABEL,
        value: pressureHpa,
        fractionDigits: 1,
        signedPositive: false,
      },
    ],
  };
}

function humidityTapPrimaryBundlePreview(
  humidityPct: number,
  streamLive: boolean,
): PalettePreview {
  return {
    kind: "primaryBundle",
    streamMode: streamLive ? "live" : "idle",
    rows: [
      {
        kind: "scalar",
        label: PALETTE_HUMIDITY_ROW_LABEL,
        value: humidityPct,
        fractionDigits: 2,
        signedPositive: false,
      },
    ],
  };
}

function scalarNumberTapPreview(nodeId: string, latestByHint: HintMap): PalettePreview {
  switch (nodeId) {
    case "dps368-tap-pressure": {
      const b = computeDps368PinBundle(latestByHint);
      return pressureTapPrimaryBundlePreview(b.pressureHpa, b.streamLive);
    }
    case "dps368-tap-temp": {
      const b = computeDps368PinBundle(latestByHint);
      return temperatureTapPrimaryBundlePreview(b.tempC, b.streamLive);
    }
    case "sht40-tap-humidity": {
      const b = computeSht40PinBundle(latestByHint);
      return humidityTapPrimaryBundlePreview(b.humidityPct, b.streamLive);
    }
    case "sht40-tap-temp": {
      const b = computeSht40PinBundle(latestByHint);
      return temperatureTapPrimaryBundlePreview(b.tempC, b.streamLive);
    }
    case "bmm350-tap-temp": {
      const b = computeBmm350PinBundle(latestByHint);
      return temperatureTapPrimaryBundlePreview(b.tempC, b.streamLive);
    }
    case "bmi270-tap-temp": {
      const b = computeBmi270PinBundle(latestByHint);
      return temperatureTapPrimaryBundlePreview(b.temp, b.streamLive);
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
      {
        kind: "vector3",
        label: PALETTE_ACCEL_ROW_LABEL,
        handleId: "accel",
        vector: b.accel,
        fractionDigits: 2,
      },
      {
        kind: "vector3",
        label: PALETTE_GYRO_ROW_LABEL,
        handleId: "gyro",
        vector: b.gyro,
        fractionDigits: 2,
      },
      {
        kind: "vector3",
        label: PALETTE_EULER_ROW_LABEL,
        handleId: "euler",
        vector: b.euler,
        fractionDigits: 3,
      },
      {
        kind: "quaternion",
        label: PALETTE_QUATERNION_ROW_LABEL,
        quaternion: b.quaternion,
        fractionDigits: 3,
      },
      {
        kind: "scalar",
        label: PALETTE_TEMPERATURE_ROW_LABEL,
        value: b.temp,
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
        label: PALETTE_PRESSURE_ROW_LABEL,
        value: b.pressureHpa,
        fractionDigits: 1,
        signedPositive: false,
      },
      {
        kind: "scalar",
        label: PALETTE_TEMPERATURE_ROW_LABEL,
        value: b.tempC,
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
        label: PALETTE_HUMIDITY_ROW_LABEL,
        value: b.humidityPct,
        fractionDigits: 2,
        signedPositive: false,
      },
      {
        kind: "scalar",
        label: PALETTE_TEMPERATURE_ROW_LABEL,
        value: b.tempC,
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
        label: PALETTE_MAGNETIC_ROW_LABEL,
        handleId: "magnetic",
        vector: b.magneticUt,
        fractionDigits: 2,
      },
      {
        kind: "scalar",
        label: PALETTE_TEMPERATURE_ROW_LABEL,
        value: b.tempC,
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
