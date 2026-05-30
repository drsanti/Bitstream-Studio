import { BITSTREAM_MAGIC, BITSTREAM_HEADER_SIZE, type BitstreamEncodedFrame } from "./frame-types";

export class BitstreamFrameEncoder {
  private sequence = 0;

  resetSequence(next = 0): void {
    this.sequence = next & 0xffff;
  }

  nextSequence(): number {
    const value = this.sequence & 0xffff;
    this.sequence = (this.sequence + 1) & 0xffff;
    return value;
  }

  encode(channel: number, flags: number, payload: Uint8Array): BitstreamEncodedFrame {
    const sequence = this.nextSequence();
    return {
      sequence,
      frame: this.encodeWithSequence(sequence, channel, flags, payload),
    };
  }

  encodeWithSequence(sequence: number, channel: number, flags: number, payload: Uint8Array): Uint8Array {
    const length = payload.byteLength;
    if (length > 0xffff) {
      throw new Error(`Payload is too large: ${length} bytes (max 65535)`);
    }

    const frame = new Uint8Array(BITSTREAM_HEADER_SIZE + length);
    const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);

    view.setUint16(0, BITSTREAM_MAGIC, true);
    view.setUint16(2, sequence & 0xffff, true);
    view.setUint8(4, channel & 0xff);
    view.setUint8(5, flags & 0xff);
    view.setUint16(6, length, true);
    frame.set(payload, BITSTREAM_HEADER_SIZE);

    return frame;
  }
}
