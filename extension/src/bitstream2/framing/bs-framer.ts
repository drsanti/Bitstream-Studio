import type { BsEnvelopeFrame } from "../protocol/types";
import { BS_PREFIX_BYTES, maxLenForType } from "./limits";
import { validateBsEnvelope } from "./bs-envelope";

export type BsFramerStats = {
  uartBytesIn: number;
  framesOk: number;
  framesCrcFail: number;
  resyncByteSkips: number;
  framesLenReject: number;
};

function concat(left: Uint8Array, right: Uint8Array): Uint8Array {
  if (left.byteLength === 0) return right;
  if (right.byteLength === 0) return left;
  const out = new Uint8Array(left.byteLength + right.byteLength);
  out.set(left, 0);
  out.set(right, left.byteLength);
  return out;
}

function startsWithPrefix(buf: Uint8Array, offset: number): boolean {
  return (
    (buf[offset] ?? 0) === BS_PREFIX_BYTES[0] &&
    (buf[offset + 1] ?? 0) === BS_PREFIX_BYTES[1] &&
    (buf[offset + 2] ?? 0) === BS_PREFIX_BYTES[2]
  );
}

/**
 * Incremental framer for the BS envelope. It is designed to be safe when UART also carries
 * non-Bitstream bytes (logs/noise): it scans for prefix, enforces LEN caps, and validates CRC.
 */
export class BsFramer {
  private buffer = new Uint8Array(0);
  private stats: BsFramerStats = {
    uartBytesIn: 0,
    framesOk: 0,
    framesCrcFail: 0,
    resyncByteSkips: 0,
    framesLenReject: 0,
  };

  reset(): void {
    this.buffer = new Uint8Array(0);
    this.stats = {
      uartBytesIn: 0,
      framesOk: 0,
      framesCrcFail: 0,
      resyncByteSkips: 0,
      framesLenReject: 0,
    };
  }

  getStats(): BsFramerStats {
    return { ...this.stats };
  }

  feed(chunk: Uint8Array): BsEnvelopeFrame[] {
    if (chunk.byteLength > 0) {
      this.stats.uartBytesIn += chunk.byteLength;
      this.buffer = concat(this.buffer, chunk);
    }

    const frames: BsEnvelopeFrame[] = [];
    let offset = 0;

    while (this.buffer.byteLength - offset >= 3) {
      if (!startsWithPrefix(this.buffer, offset)) {
        offset += 1;
        this.stats.resyncByteSkips += 1;
        continue;
      }

      if (this.buffer.byteLength - offset < 3 + 2 + 1) {
        break;
      }

      const len = (this.buffer[offset + 3] ?? 0) | ((this.buffer[offset + 4] ?? 0) << 8);
      const type = this.buffer[offset + 5] ?? 0;
      const maxLen = maxLenForType(type);
      if (len > maxLen) {
        offset += 1;
        this.stats.framesLenReject += 1;
        continue;
      }

      const needed = 3 + 2 + 1 + len + 2 + 2;
      if (this.buffer.byteLength - offset < needed) {
        break;
      }

      const slice = this.buffer.slice(offset, offset + needed);
      const validated = validateBsEnvelope(slice, maxLen);
      if (!validated.ok) {
        if (validated.reason === "crc") {
          this.stats.framesCrcFail += 1;
        }
        offset += 1;
        this.stats.resyncByteSkips += 1;
        continue;
      }

      frames.push(validated.frame);
      this.stats.framesOk += 1;
      offset += needed;
    }

    this.buffer = this.buffer.slice(offset);
    return frames;
  }
}

