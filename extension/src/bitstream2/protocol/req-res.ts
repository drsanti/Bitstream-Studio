export type BsReq = {
  reqId: number;
  cmdId: number;
  flags: number;
  body: Uint8Array;
};

export type BsRes = {
  reqId: number;
  cmdId: number;
  status: number;
  body: Uint8Array;
};

export function decodeReq(payload: Uint8Array): BsReq | null {
  if (payload.byteLength < 4) return null;
  const reqId = (payload[0] ?? 0) | ((payload[1] ?? 0) << 8);
  const cmdId = payload[2] ?? 0;
  const flags = payload[3] ?? 0;
  return { reqId, cmdId, flags, body: payload.slice(4) };
}

export function encodeReq(req: BsReq): Uint8Array {
  const out = new Uint8Array(4 + req.body.byteLength);
  out[0] = req.reqId & 0xff;
  out[1] = (req.reqId >> 8) & 0xff;
  out[2] = req.cmdId & 0xff;
  out[3] = req.flags & 0xff;
  out.set(req.body, 4);
  return out;
}

export function decodeRes(payload: Uint8Array): BsRes | null {
  if (payload.byteLength < 4) return null;
  const reqId = (payload[0] ?? 0) | ((payload[1] ?? 0) << 8);
  const cmdId = payload[2] ?? 0;
  const status = payload[3] ?? 0;
  return { reqId, cmdId, status, body: payload.slice(4) };
}

export function encodeRes(res: BsRes): Uint8Array {
  const out = new Uint8Array(4 + res.body.byteLength);
  out[0] = res.reqId & 0xff;
  out[1] = (res.reqId >> 8) & 0xff;
  out[2] = res.cmdId & 0xff;
  out[3] = res.status & 0xff;
  out.set(res.body, 4);
  return out;
}

