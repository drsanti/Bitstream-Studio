import type { Bitstream2SensorSamplePayload } from "../../../bitstream2/bridge/protocol";
import { decodeBmi270Values } from "../../../bitstream2/domains/sensors/bmi270";
import { decodeBmm350Values } from "../../../bitstream2/domains/sensors/bmm350";
import { decodeSht40Values } from "../../../bitstream2/domains/sensors/sht40";
import { decodeDps368Values } from "../../../bitstream2/domains/sensors/dps368";
import { BS2_SENSOR_ID } from "../../../bitstream2/domains/sensors/sensor-ids";
import { sensorIdLabel } from "../../../bitstream2/domains/sensors/decode-sensor-sample";

export type SensorDisplayRow = { label: string; value: string };

export { sensorIdLabel };

function fmtSignedInt(v: number): string {
  return v >= 0 ? `+${v}` : `${v}`;
}

function fmtSignedFixed(v: number, digits: number): string {
  const s = v.toFixed(digits);
  return v >= 0 ? `+${s}` : s;
}

function valuesToBytes(values: number[]): Uint8Array {
  const out = new Uint8Array(values.length * 2);
  const view = new DataView(out.buffer);
  values.forEach((v, i) => view.setInt16(i * 2, v, true));
  return out;
}

export function formatSensorSample(sample: Bitstream2SensorSamplePayload): SensorDisplayRow[] {
  const bytes = valuesToBytes(sample.values);

  if (sample.sensorId === BS2_SENSOR_ID.BMI270) {
    const r = decodeBmi270Values(sample.mask, bytes);
    if (!r.ok) return [{ label: "raw", value: sample.values.join(", ") }];
    const d = r.decoded;
    const rows: SensorDisplayRow[] = [];
    if (d.ax_ms2_x100 != null) {
      rows.push(
        { label: "ACC X", value: `${fmtSignedFixed(d.ax_ms2_x100 / 100, 2)} m/s²` },
        { label: "ACC Y", value: `${fmtSignedFixed(d.ay_ms2_x100! / 100, 2)} m/s²` },
        { label: "ACC Z", value: `${fmtSignedFixed(d.az_ms2_x100! / 100, 2)} m/s²` },
      );
    }
    if (d.gx_rads_x100 != null) {
      rows.push(
        { label: "GYR X", value: `${fmtSignedFixed(d.gx_rads_x100 / 100, 3)} rad/s` },
        { label: "GYR Y", value: `${fmtSignedFixed(d.gy_rads_x100! / 100, 3)} rad/s` },
        { label: "GYR Z", value: `${fmtSignedFixed(d.gz_rads_x100! / 100, 3)} rad/s` },
      );
    }
    if (d.temp_cx100 != null) rows.push({ label: "Temp", value: fmtSignedFixed(d.temp_cx100 / 100, 2) });
    if (d.heading_radx100 != null) {
      rows.push(
        { label: "Heading", value: `${fmtSignedFixed(d.heading_radx100 / 100, 2)} rad` },
        { label: "Pitch", value: `${fmtSignedFixed(d.pitch_radx100! / 100, 2)} rad` },
        { label: "Roll", value: `${fmtSignedFixed(d.roll_radx100! / 100, 2)} rad` },
      );
    }
    if (d.qw_x10000 != null) {
      rows.push(
        { label: "Quat W", value: fmtSignedFixed(d.qw_x10000 / 10000, 4) },
        { label: "Quat X", value: fmtSignedFixed(d.qx_x10000! / 10000, 4) },
        { label: "Quat Y", value: fmtSignedFixed(d.qy_x10000! / 10000, 4) },
        { label: "Quat Z", value: fmtSignedFixed(d.qz_x10000! / 10000, 4) },
      );
    }
    return rows;
  }

  if (sample.sensorId === BS2_SENSOR_ID.BMM350) {
    const r = decodeBmm350Values(sample.mask, bytes);
    if (!r.ok) return [{ label: "raw", value: sample.values.join(", ") }];
    const d = r.decoded;
    const rows: SensorDisplayRow[] = [];
    if (d.mx_ut_x100 != null) {
      rows.push(
        { label: "Mag X", value: fmtSignedFixed(d.mx_ut_x100 / 100, 2) },
        { label: "Mag Y", value: fmtSignedFixed(d.my_ut_x100! / 100, 2) },
        { label: "Mag Z", value: fmtSignedFixed(d.mz_ut_x100! / 100, 2) },
      );
    }
    if (d.temp_cx100 != null) rows.push({ label: "Temp", value: fmtSignedFixed(d.temp_cx100 / 100, 2) });
    return rows;
  }

  if (sample.sensorId === BS2_SENSOR_ID.SHT40) {
    const r = decodeSht40Values(sample.mask, bytes);
    if (!r.ok) return [{ label: "raw", value: sample.values.join(", ") }];
    const d = r.decoded;
    const rows: SensorDisplayRow[] = [];
    if (d.temp_cx100 != null) rows.push({ label: "Temp", value: fmtSignedFixed(d.temp_cx100 / 100, 2) });
    if (d.rh_x100 != null) rows.push({ label: "RH", value: fmtSignedFixed(d.rh_x100 / 100, 1) });
    return rows;
  }

  if (sample.sensorId === BS2_SENSOR_ID.DPS368) {
    const r = decodeDps368Values(sample.mask, bytes);
    if (!r.ok) return [{ label: "raw", value: sample.values.join(", ") }];
    const d = r.decoded;
    const rows: SensorDisplayRow[] = [];
    if (d.pressure_hpa_x10 != null) {
      rows.push({ label: "Pressure", value: `${fmtSignedFixed(d.pressure_hpa_x10 / 10, 1)} hPa` });
    }
    if (d.temp_cx100 != null) rows.push({ label: "Temp", value: fmtSignedFixed(d.temp_cx100 / 100, 2) });
    return rows;
  }

  return [{ label: "raw", value: sample.values.join(", ") }];
}
