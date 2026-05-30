import type { BsEnvelopeFrame } from "../protocol/types";
import { BS_TYPE } from "../protocol/types";
import { encodeBsEnvelope } from "../framing/bs-envelope";
import { encodeReq, type BsReq, decodeRes, type BsRes } from "../protocol/req-res";

export interface BsSessionTransport {
  write(bytes: Uint8Array): Promise<void>;
}

export type BsPendingReq = {
  requestId: string;
  reqId: number;
  cmdId: number;
  resolve: (res: BsRes) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
};

/**
 * Minimal backend-owned request/response correlator for BS REQ/RES.
 * Framing/CRC happens elsewhere; this runs on already-decoded frames.
 */
export class BsSession {
  private pendingByReqId = new Map<number, BsPendingReq>();
  private reqIdSeq = 1;

  constructor(private readonly transport: BsSessionTransport) {}

  nextReqId(): number {
    const v = this.reqIdSeq & 0xffff;
    this.reqIdSeq = (this.reqIdSeq + 1) & 0xffff;
    return v === 0 ? 1 : v;
  }

  async sendReq(args: {
    requestId: string;
    cmdId: number;
    flags?: number;
    body?: Uint8Array;
    timeoutMs?: number;
  }): Promise<BsRes> {
    const reqId = this.nextReqId();
    const req: BsReq = {
      reqId,
      cmdId: args.cmdId,
      flags: args.flags ?? 0,
      body: args.body ?? new Uint8Array(0),
    };
    const payload = encodeReq(req);
    const encoded = encodeBsEnvelope({ type: BS_TYPE.REQ, payload }).bytes;

    const timeoutMs = Math.max(100, Math.floor(args.timeoutMs ?? 2000));

    return await new Promise<BsRes>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingByReqId.delete(reqId);
        reject(new Error(`REQ timeout (cmdId=0x${req.cmdId.toString(16)}, reqId=${reqId})`));
      }, timeoutMs);

      this.pendingByReqId.set(reqId, {
        requestId: args.requestId,
        reqId,
        cmdId: req.cmdId,
        resolve,
        reject,
        timer,
      });

      this.transport.write(encoded).catch((e: unknown) => {
        clearTimeout(timer);
        this.pendingByReqId.delete(reqId);
        reject(e instanceof Error ? e : new Error(String(e)));
      });
    });
  }

  /**
   * Feed validated BS envelopes to complete pending requests.
   */
  handleFrame(frame: BsEnvelopeFrame): void {
    if (frame.type !== BS_TYPE.RES) return;
    const res = decodeRes(frame.payload);
    if (!res) return;
    const pending = this.pendingByReqId.get(res.reqId);
    if (!pending) return;
    if (pending.timer) clearTimeout(pending.timer);
    this.pendingByReqId.delete(res.reqId);
    pending.resolve(res);
  }

  /** Drop pending REQ waiters after COM close / hotplug (stale correlators). */
  cancelAllPending(reason = "BS session reset"): void {
    for (const pending of this.pendingByReqId.values())
    {
      if (pending.timer != null)
      {
        clearTimeout(pending.timer);
      }
      pending.reject(new Error(reason));
    }
    this.pendingByReqId.clear();
  }
}

