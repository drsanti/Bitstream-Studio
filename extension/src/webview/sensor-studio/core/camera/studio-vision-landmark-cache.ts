import type { PoseLandmarkLike } from "./vision-pose-config";

type CacheEntry = {
  landmarks: readonly PoseLandmarkLike[];
  updatedAtMs: number;
};

class StudioVisionLandmarkCache {
  private byVisionNodeId = new Map<string, CacheEntry>();

  setLandmarks(visionNodeId: string, landmarks: readonly PoseLandmarkLike[] | undefined): void {
    if (landmarks == null || landmarks.length === 0) {
      this.byVisionNodeId.delete(visionNodeId);
      return;
    }
    this.byVisionNodeId.set(visionNodeId, {
      landmarks,
      updatedAtMs: Date.now(),
    });
  }

  getLandmarks(visionNodeId: string): readonly PoseLandmarkLike[] | undefined {
    return this.byVisionNodeId.get(visionNodeId)?.landmarks;
  }

  releaseNode(visionNodeId: string): void {
    this.byVisionNodeId.delete(visionNodeId);
  }
}

export const studioVisionLandmarkCache = new StudioVisionLandmarkCache();
