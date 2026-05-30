export type BsEvtSensor = {
  sensorId: number;
  mask: number;
  counter: number;
  tMs: number;
  valuesBytes: Uint8Array;
};

export function decodeEvtSensor(payload: Uint8Array): BsEvtSensor | null {
  if (payload.byteLength < 1 + 1 + 4 + 4) return null;
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const sensorId = payload[0] ?? 0;
  const mask = payload[1] ?? 0;
  const counter = view.getUint32(2, true);
  const tMs = view.getUint32(6, true);
  const valuesBytes = payload.slice(10);
  return { sensorId, mask, counter, tMs, valuesBytes };
}

