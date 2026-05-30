import type { BsFramerStats } from "../framing/bs-framer";

export type Bitstream2RuntimeMetrics = BsFramerStats & {
  framesOk: number;
  framesCrcFail: number;
  resyncByteSkips: number;
  framesLenReject: number;
};

export function makeMetricsSnapshot(stats: BsFramerStats): Bitstream2RuntimeMetrics {
  return {
    ...stats,
  };
}

