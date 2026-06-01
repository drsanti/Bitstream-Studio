import type { SerialRxWireWindowStats } from "../../../serialport-bridge/protocol";

const WINDOW_MS = 1000;

/** Rolling ~1s RX byte estimate for BS2 broker JSON (`bitstream2/evt/sensor`). */
export class Bs2WireRxWindowAccumulator {
  private bytesMain = 0;
  private chunksMain = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly onWindow: (stats: SerialRxWireWindowStats | null) => void,
  ) {}

  start(): void {
    if (this.timer != null) {
      return;
    }
    this.timer = setInterval(() => this.flush(), WINDOW_MS);
  }

  stop(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.bytesMain = 0;
    this.chunksMain = 0;
    this.onWindow(null);
  }

  recordEvtSensorPayload(payload: unknown): void {
    const bytes = estimateJsonPayloadBytes(payload);
    if (bytes <= 0) {
      return;
    }
    this.bytesMain += bytes;
    this.chunksMain += 1;
    if (this.timer == null) {
      this.start();
    }
  }

  private flush(): void {
    const stats: SerialRxWireWindowStats = {
      chunksMainPerSec: this.chunksMain,
      bytesMainPerSec: this.bytesMain,
      chunksPriorityPerSec: 0,
      bytesPriorityPerSec: 0,
      windowMs: WINDOW_MS,
      updatedAtMs: Date.now(),
      bulkDataBinaryQos: 0,
    };
    this.bytesMain = 0;
    this.chunksMain = 0;
    this.onWindow(stats);
  }
}

function estimateJsonPayloadBytes(payload: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(payload)).length;
  } catch {
    return 0;
  }
}
