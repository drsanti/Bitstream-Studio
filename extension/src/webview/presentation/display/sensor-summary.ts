import type { BitstreamSensorSampleV2 } from "../../../bitstream/events/sensor-decoder";
import { BS2_SENSOR_ID } from "../../../bitstream2/domains/sensors/sensor-ids";

export type PresentationSensorHint = "bmi270" | "bmm350" | "sht40" | "dps368";

export type PresentationSensorRow = {
  hint: PresentationSensorHint;
  sensorId: number;
  name: string;
  hasSample: boolean;
  counter: number | null;
  summary: string;
  lastAtMs: number | null;
};

export const PRESENTATION_SENSOR_ROWS: Array<{
  hint: PresentationSensorHint;
  sensorId: number;
  name: string;
}> = [
  { hint: "bmi270", sensorId: BS2_SENSOR_ID.BMI270, name: "BMI270 IMU" },
  { hint: "bmm350", sensorId: BS2_SENSOR_ID.BMM350, name: "BMM350 Mag" },
  { hint: "sht40", sensorId: BS2_SENSOR_ID.SHT40, name: "SHT40 RH/T" },
  { hint: "dps368", sensorId: BS2_SENSOR_ID.DPS368, name: "DPS368 Baro" },
];

function formatTemp(cX100: number | undefined): string | null {
  if (cX100 == null) {
    return null;
  }
  return `${(cX100 / 100).toFixed(1)} °C`;
}

/** One-line summary for the multi-sensor demo table. */
export function formatSensorSampleSummary(sample: BitstreamSensorSampleV2 | null | undefined): string {
  if (sample == null) {
    return "—";
  }

  const temp = formatTemp(sample.temperatureCx100);

  if (sample.sourceHint === "bmi270") {
    if (sample.accelXMs2X100 != null) {
      const g = 9.80665;
      const ax = sample.accelXMs2X100 / 100 / g;
      const ay = (sample.accelYMs2X100 ?? 0) / 100 / g;
      const az = (sample.accelZMs2X100 ?? 0) / 100 / g;
      const parts = [`a ${ax.toFixed(2)} ${ay.toFixed(2)} ${az.toFixed(2)} g`];
      if (temp) {
        parts.push(temp);
      }
      return parts.join(" · ");
    }
    if (temp) {
      return temp;
    }
    return `counter ${sample.counter}`;
  }

  if (sample.sourceHint === "bmm350") {
    if (sample.magneticXUtX100 != null) {
      const bx = sample.magneticXUtX100 / 100;
      const by = (sample.magneticYUtX100 ?? 0) / 100;
      const bz = (sample.magneticZUtX100 ?? 0) / 100;
      return `B ${bx.toFixed(1)} ${by.toFixed(1)} ${bz.toFixed(1)} µT`;
    }
    if (temp) {
      return temp;
    }
    return `counter ${sample.counter}`;
  }

  if (sample.sourceHint === "sht40") {
    const parts: string[] = [];
    if (temp) {
      parts.push(temp);
    }
    if (sample.secondaryX100 != null) {
      parts.push(`${(sample.secondaryX100 / 100).toFixed(1)} %RH`);
    }
    return parts.length > 0 ? parts.join(" · ") : `counter ${sample.counter}`;
  }

  if (sample.sourceHint === "dps368") {
    const parts: string[] = [];
    if (temp) {
      parts.push(temp);
    }
    if (sample.secondaryX100 != null) {
      parts.push(`${(sample.secondaryX100 / 10).toFixed(1)} hPa`);
    }
    return parts.length > 0 ? parts.join(" · ") : `counter ${sample.counter}`;
  }

  return `counter ${sample.counter}`;
}

export function buildPresentationSensorRows(args: {
  latestByHint: Record<PresentationSensorHint, BitstreamSensorSampleV2 | null>;
  lastAtByHint: Record<PresentationSensorHint, number | null>;
}): PresentationSensorRow[] {
  return PRESENTATION_SENSOR_ROWS.map(({ hint, sensorId, name }) => {
    const sample = args.latestByHint[hint];
    const lastAtMs = args.lastAtByHint[hint];
    return {
      hint,
      sensorId,
      name,
      hasSample: sample != null,
      counter: sample?.counter ?? null,
      summary: formatSensorSampleSummary(sample),
      lastAtMs,
    };
  });
}
