import type { Bitstream2HostReqPayload, Bitstream2HostResPayload } from "../bridge/protocol";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitUntil(maxMs: number, pred: () => boolean, stepMs = 25): Promise<boolean> {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    if (pred()) {
      return true;
    }
    await sleep(stepMs);
  }
  return pred();
}

export type ProviderCommandServiceOptions = {
  publishReq: (payload: Bitstream2HostReqPayload) => Promise<void>;
  onRes: (handler: (res: Bitstream2HostResPayload) => void) => () => void;
  defaultTimeoutMs?: number;
};

/** Await `bitstream2/res` for REQ publishes (gateway + Course shell). */
export class ProviderCommandService {
  private readonly publishReq: ProviderCommandServiceOptions["publishReq"];
  private readonly defaultTimeoutMs: number;
  private readonly resByRequestId = new Map<string, Bitstream2HostResPayload>();
  private readonly unsubscribe: () => void;

  constructor(opts: ProviderCommandServiceOptions) {
    this.publishReq = opts.publishReq;
    this.defaultTimeoutMs = opts.defaultTimeoutMs ?? 4000;
    this.unsubscribe = opts.onRes((res) => {
      if (res.requestId) {
        this.resByRequestId.set(res.requestId, res);
      }
    });
  }

  dispose(): void {
    this.unsubscribe();
    this.resByRequestId.clear();
  }

  noteRes(res: Bitstream2HostResPayload): void {
    if (res.requestId) {
      this.resByRequestId.set(res.requestId, res);
    }
  }

  async sendReq(options: {
    cmdId: number;
    bodyB64?: string;
    reqId?: number;
    timeoutMs?: number;
    requestId?: string;
  }): Promise<Bitstream2HostResPayload> {
    const requestId = options.requestId ?? `provider-req-${options.cmdId}-${Date.now()}`;
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const reqId = options.reqId ?? 1;

    await this.publishReq({
      requestId,
      reqId,
      cmdId: options.cmdId,
      bodyB64: options.bodyB64,
      timeoutMs,
    });

    const got = await waitUntil(timeoutMs + 500, () => this.resByRequestId.has(requestId));
    const res = this.resByRequestId.get(requestId);
    this.resByRequestId.delete(requestId);
    if (!got || res == null) {
      throw new Error(`BS2 cmd 0x${options.cmdId.toString(16)}: no RES`);
    }
    return res;
  }
}
