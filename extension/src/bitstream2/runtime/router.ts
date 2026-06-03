import type { BsEnvelopeFrame } from "../protocol/types";
import { BS_TYPE } from "../protocol/types";
import { decodeHello } from "../protocol/hello";
import { decodeReq, decodeRes } from "../protocol/req-res";
import { decodeEvtSensor } from "../protocol/evt-sensor";

export type BsRouterEvent =
  | { type: "hello"; hello: ReturnType<typeof decodeHello> extends infer T ? Exclude<T, null> : never }
  | { type: "req"; req: NonNullable<ReturnType<typeof decodeReq>> }
  | { type: "res"; res: NonNullable<ReturnType<typeof decodeRes>> }
  | { type: "evt_sensor"; evt: NonNullable<ReturnType<typeof decodeEvtSensor>> }
  | { type: "evt_status"; payload: Uint8Array }
  | { type: "unknown"; frame: BsEnvelopeFrame };

export function routeFrame(frame: BsEnvelopeFrame): BsRouterEvent {
  if (frame.type === BS_TYPE.HELLO) {
    const hello = decodeHello(frame.payload);
    return hello ? { type: "hello", hello } : { type: "unknown", frame };
  }
  if (frame.type === BS_TYPE.REQ) {
    const req = decodeReq(frame.payload);
    return req ? { type: "req", req } : { type: "unknown", frame };
  }
  if (frame.type === BS_TYPE.RES) {
    const res = decodeRes(frame.payload);
    return res ? { type: "res", res } : { type: "unknown", frame };
  }
  if (frame.type === BS_TYPE.EVT_SENSOR) {
    const evt = decodeEvtSensor(frame.payload);
    return evt ? { type: "evt_sensor", evt } : { type: "unknown", frame };
  }
  if (frame.type === BS_TYPE.EVT_STATUS) {
    return { type: "evt_status", payload: frame.payload };
  }
  return { type: "unknown", frame };
}

