import { BitstreamFrameDecoder } from "../frame/frame-decoder";
import { BitstreamFrameEncoder } from "../frame/frame-encoder";
import type { BitstreamEncodedFrame } from "../frame/frame-types";
import type { BitstreamFrame } from "../frame/frame-types";
import { RequestTracker } from "./request-tracker";
import type { PendingRequest } from "./request-tracker";
import type { TimeoutPolicy } from "./timeout-policy";

export interface ProtocolEngineOptions {
  timeoutPolicy?: Partial<TimeoutPolicy>;
}

export interface ProtocolRequest {
  requestId: string;
  channel: number;
  commandId: number;
  flags?: number;
  payload: Uint8Array;
  timeoutMs?: number;
  retryCount?: number;
}

export interface ProtocolTimeoutActions {
  retries: PendingRequest[];
  expired: PendingRequest[];
}

export class ProtocolEngine {
  readonly encoder: BitstreamFrameEncoder;
  readonly decoder: BitstreamFrameDecoder;
  readonly tracker: RequestTracker;

  constructor(options: ProtocolEngineOptions = {}) {
    this.encoder = new BitstreamFrameEncoder();
    this.decoder = new BitstreamFrameDecoder();
    this.tracker = new RequestTracker(options.timeoutPolicy);
  }

  createRequest(req: ProtocolRequest): BitstreamEncodedFrame {
    const payload = new Uint8Array(req.payload.byteLength + 1);
    payload[0] = req.commandId & 0xff;
    payload.set(req.payload, 1);

    const encoded = this.encoder.encode(req.channel, req.flags ?? 0, payload);
    this.tracker.add(req.requestId, encoded.sequence, req.commandId, req.channel, encoded.frame, {
      timeoutMs: req.timeoutMs,
      retryCount: req.retryCount,
    });
    return encoded;
  }

  createRequestFrame(req: ProtocolRequest): Uint8Array {
    return this.createRequest(req).frame;
  }

  feed(chunk: Uint8Array): BitstreamFrame[] {
    return this.decoder.feed(chunk).frames;
  }

  complete(sequence: number) {
    return this.tracker.complete(sequence);
  }

  handleIncomingFrame(frame: BitstreamFrame): PendingRequest | null {
    const eventId = frame.payload[0] ?? 0;
    /**
     * Completes pending {@link HostSession.send} only for **request/response ACK** IDs (0x80–0x9F).
     * Wi‑Fi async notifications use **0xA0+** with MSB set too; they must not steal completion or the
     * wrong frame resolves the promise and decoders throw / timeouts occur on real ACKs.
     */
    const isRequestAck = eventId >= 0x80 && eventId <= 0x9f;
    if (!isRequestAck) {
      return null;
    }

    const pending = this.tracker.getBySequence(frame.sequence);
    if (!pending) {
      return null;
    }
    if (pending.channel !== frame.channel) {
      /** Another subsystem may reuse the same 16‑bit sequence on a different channel; ignore. */
      return null;
    }

    return this.tracker.complete(frame.sequence) ?? null;
  }

  pollTimeouts(now = Date.now()): ProtocolTimeoutActions {
    const retries: PendingRequest[] = [];
    const expired: PendingRequest[] = [];

    const timedOut = this.tracker.timedOut(now);
    for (const req of timedOut) {
      const decision = this.tracker.markRetry(req.sequence);
      if (!decision) {
        continue;
      }
      if (decision.kind === "retry") {
        retries.push(decision.request);
      } else {
        expired.push(decision.request);
      }
    }

    return { retries, expired };
  }

  reset(): void {
    this.decoder.reset();
    this.tracker.clear();
    this.encoder.resetSequence(0);
  }
}
