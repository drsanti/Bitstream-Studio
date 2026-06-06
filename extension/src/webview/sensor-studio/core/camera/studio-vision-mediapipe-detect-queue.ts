/**
 * MediaPipe VIDEO mode requires strictly increasing timestamps in milliseconds.
 * Do not use Date.now() — values overflow internal int32 limits (~2.147e9 ms).
 * Serialize detectForVideo on shared landmarkers so async nodes cannot submit
 * timestamps out of order.
 */
export class VisionMediaPipeDetectQueue {
  private chain: Promise<unknown> = Promise.resolve();
  private lastTimestampMs = 0;

  run<T>(video: HTMLVideoElement, fn: (timestampMs: number) => T | Promise<T>): Promise<T> {
    const job = this.chain.then(() => {
      const fromVideo =
        Number.isFinite(video.currentTime) && video.currentTime > 0
          ? Math.round(video.currentTime * 1000)
          : 0;
      this.lastTimestampMs = Math.max(this.lastTimestampMs + 1, fromVideo);
      return fn(this.lastTimestampMs);
    });
    this.chain = job.then(
      () => undefined,
      () => undefined,
    );
    return job as Promise<T>;
  }
}

const detectQueueByScope = new Map<string, VisionMediaPipeDetectQueue>();

export function visionMediaPipeDetectQueue(scopeId: string): VisionMediaPipeDetectQueue {
  let queue = detectQueueByScope.get(scopeId);
  if (queue == null) {
    queue = new VisionMediaPipeDetectQueue();
    detectQueueByScope.set(scopeId, queue);
  }
  return queue;
}

/** Monotonic timestamps for worker / ImageBitmap inference (no video.currentTime). */
export class VisionMediaPipeTimestampCounter {
  private lastTimestampMs = 0;

  next(): number {
    this.lastTimestampMs += 1;
    return this.lastTimestampMs;
  }

  reset(): void {
    this.lastTimestampMs = 0;
  }
}
