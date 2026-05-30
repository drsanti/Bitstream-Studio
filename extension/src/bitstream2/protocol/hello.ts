import { BS_TYPE } from "./types";

export type BsHello = {
  version: number;
  caps: number;
  mtuSensor: number;
  mtuCtrl: number;
  fwTag?: string;
};

export function decodeHello(payload: Uint8Array): BsHello | null {
  if (payload.byteLength < 1 + 2 + 2 + 2 + 1) {
    return null;
  }
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const version = payload[0] ?? 0;
  const caps = view.getUint16(1, true);
  const mtuSensor = view.getUint16(3, true);
  const mtuCtrl = view.getUint16(5, true);
  const fwLen = payload[7] ?? 0;
  const fwStart = 8;
  const fwEnd = fwStart + fwLen;
  if (payload.byteLength < fwEnd) {
    return null;
  }
  let fwTag: string | undefined;
  if (fwLen > 0) {
    const bytes = payload.slice(fwStart, fwEnd);
    fwTag = new TextDecoder().decode(bytes);
  }
  return { version, caps, mtuSensor, mtuCtrl, ...(fwTag ? { fwTag } : {}) };
}

export function encodeHello(msg: BsHello): Uint8Array {
  const fwBytes = msg.fwTag ? new TextEncoder().encode(msg.fwTag) : new Uint8Array(0);
  const payload = new Uint8Array(8 + fwBytes.byteLength);
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  payload[0] = msg.version & 0xff;
  view.setUint16(1, msg.caps & 0xffff, true);
  view.setUint16(3, msg.mtuSensor & 0xffff, true);
  view.setUint16(5, msg.mtuCtrl & 0xffff, true);
  payload[7] = fwBytes.byteLength & 0xff;
  payload.set(fwBytes, 8);
  return payload;
}

export const BS_HELLO_TYPE = BS_TYPE.HELLO;

