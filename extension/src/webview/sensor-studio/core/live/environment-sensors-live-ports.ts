import type { BitstreamSensorSampleV2 } from "../../../../bitstream/events/sensor-decoder";
import { pressureHpaFromWireSecondaryX100 } from "../../../bitstream-app/telemetry/pressureDisplay";

/** µT vector decoded from int16 ×100 fields (matches `decodeBmm350Sample`). */
export type MagneticMicroteslaVec3 = { x: number; y: number; z: number };

function scaleInt16X100(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return value / 100;
}

/** Wire: secondaryX100 stores %RH × 100 — same scaling as `SHT40DataViewer`. */
function scaleHumidityPctFromSecondaryX100(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return value / 100;
}

/** Pressure (hPa) and temperature (°C) — same scaling as `DPS368DataViewer` (pressure: hPa×10 in `secondaryX100`). */
export function computeDps368PinBundle(latestByHint: {
  dps368: BitstreamSensorSampleV2 | null;
}): {
  pressureHpa: number;
  tempC: number;
  counter: number;
  streamLive: boolean;
} {
  const s = latestByHint.dps368;
  if (s != null && s.sourceHint === "dps368") {
    const hasPressure = typeof s.secondaryX100 === "number" && Number.isFinite(s.secondaryX100);
    const hasTemp = typeof s.temperatureCx100 === "number" && Number.isFinite(s.temperatureCx100);
    return {
      pressureHpa: hasPressure
        ? pressureHpaFromWireSecondaryX100(s.secondaryX100)
        : 0,
      tempC: hasTemp ? scaleInt16X100(s.temperatureCx100) : 0,
      counter: s.counter,
      streamLive: true,
    };
  }
  return {
    pressureHpa: 0,
    tempC: 0,
    counter: 0,
    streamLive: false,
  };
}

/** RH (% ) and temperature (°C) — same scaling as `SHT40DataViewer`. */
export function computeSht40PinBundle(latestByHint: {
  sht40: BitstreamSensorSampleV2 | null;
}): {
  humidityPct: number;
  tempC: number;
  counter: number;
  streamLive: boolean;
} {
  const s = latestByHint.sht40;
  if (s != null && s.sourceHint === "sht40") {
    const hasHumidity = typeof s.secondaryX100 === "number" && Number.isFinite(s.secondaryX100);
    const hasTemp = typeof s.temperatureCx100 === "number" && Number.isFinite(s.temperatureCx100);
    return {
      humidityPct: hasHumidity ? scaleHumidityPctFromSecondaryX100(s.secondaryX100) : 0,
      tempC: hasTemp ? scaleInt16X100(s.temperatureCx100) : 0,
      counter: s.counter,
      streamLive: true,
    };
  }
  return {
    humidityPct: 0,
    tempC: 0,
    counter: 0,
    streamLive: false,
  };
}

/** Magnetic triplet (µT) and temperature (°C). */
export function computeBmm350PinBundle(latestByHint: {
  bmm350: BitstreamSensorSampleV2 | null;
}): {
  magneticUt: MagneticMicroteslaVec3;
  tempC: number;
  counter: number;
  streamLive: boolean;
} {
  const s = latestByHint.bmm350;
  if (s != null && s.sourceHint === "bmm350") {
    const hasMagTriple =
      s.magneticXUtX100 !== undefined &&
      s.magneticYUtX100 !== undefined &&
      s.magneticZUtX100 !== undefined;
    return {
      magneticUt: hasMagTriple
        ? {
            x: scaleInt16X100(s.magneticXUtX100),
            y: scaleInt16X100(s.magneticYUtX100),
            z: scaleInt16X100(s.magneticZUtX100),
          }
        : { x: 0, y: 0, z: 0 },
      tempC: scaleInt16X100(s.temperatureCx100),
      counter: s.counter,
      streamLive: true,
    };
  }
  return {
    magneticUt: { x: 0, y: 0, z: 0 },
    tempC: 0,
    counter: 0,
    streamLive: false,
  };
}
