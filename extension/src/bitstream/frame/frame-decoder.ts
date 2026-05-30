import {
  BITSTREAM_HEADER_SIZE,
  BITSTREAM_MAGIC,
  type BitstreamDecodeResult,
  type BitstreamFrame,
  type BitstreamFrameHeader,
} from "./frame-types";

function concatBytes(left: Uint8Array, right: Uint8Array): Uint8Array {
  if (left.byteLength === 0) return right;
  if (right.byteLength === 0) return left;
  const out = new Uint8Array(left.byteLength + right.byteLength);
  out.set(left, 0);
  out.set(right, left.byteLength);
  return out;
}

export class BitstreamFrameDecoder {
  private buffer: Uint8Array = new Uint8Array(0);

  reset(): void {
    this.buffer = new Uint8Array(0);
  }

  getBufferedBytes(): number {
    return this.buffer.byteLength;
  }

  peekHeader(offset = 0): BitstreamFrameHeader | null {
    if (this.buffer.byteLength - offset < BITSTREAM_HEADER_SIZE) {
      return null;
    }
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + offset, BITSTREAM_HEADER_SIZE);
    return {
      magic: view.getUint16(0, true),
      sequence: view.getUint16(2, true),
      channel: view.getUint8(4),
      flags: view.getUint8(5),
      payloadLength: view.getUint16(6, true),
    };
  }

  feed(chunk: Uint8Array): BitstreamDecodeResult {
    if (chunk.byteLength > 0) {
      this.buffer = concatBytes(this.buffer, chunk);
    }

    const frames: BitstreamFrame[] = [];
    let offset = 0;

    while (this.buffer.byteLength - offset >= BITSTREAM_HEADER_SIZE) {
      const header = this.peekHeader(offset);
      if (header == null) {
        break;
      }

      if (header.magic !== BITSTREAM_MAGIC) {
        offset += 1;
        continue;
      }

      const totalLength = BITSTREAM_HEADER_SIZE + header.payloadLength;
      if (this.buffer.byteLength - offset < totalLength) {
        break;
      }

      const payloadStart = offset + BITSTREAM_HEADER_SIZE;
      const payloadEnd = payloadStart + header.payloadLength;
      const payload = this.buffer.slice(payloadStart, payloadEnd);

      frames.push({
        sequence: header.sequence,
        channel: header.channel,
        flags: header.flags,
        payload,
      });

      offset += totalLength;
    }

    this.buffer = this.buffer.slice(offset);

    return {
      frames,
      bufferedBytes: this.buffer.byteLength,
    };
  }
}
