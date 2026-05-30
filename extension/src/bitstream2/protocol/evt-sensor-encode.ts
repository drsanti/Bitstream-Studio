import type { BsEvtSensor } from "./evt-sensor";

/** Encode EVT_SENSOR payload (mirror of decodeEvtSensor layout). */
export function encodeEvtSensor(evt: BsEvtSensor): Uint8Array {
  const out = new Uint8Array(10 + evt.valuesBytes.byteLength);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  out[0] = evt.sensorId & 0xff;
  out[1] = evt.mask & 0xff;
  view.setUint32(2, evt.counter >>> 0, true);
  view.setUint32(6, evt.tMs >>> 0, true);
  out.set(evt.valuesBytes, 10);
  return out;
}
