import * as THREE from "three";

export type CameraCaptureStatus = "idle" | "requesting" | "active" | "denied" | "error";

type CameraState = {
  enabled: boolean;
  status: CameraCaptureStatus;
  errorMessage?: string;
  deviceId: string;
  facingMode: "user" | "environment";
  width: number;
  height: number;
  targetFps: number;
  mirrorPreview: boolean;
  stream?: MediaStream;
  videoEl?: HTMLVideoElement;
  fpsWindowStartMs?: number;
  fpsFrameCount?: number;
  measuredFps?: number;
};

type VideoTextureState = {
  cameraNodeId: string;
  flipY: boolean;
  texture?: THREE.VideoTexture;
  ready: boolean;
};

function clampDimension(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(3840, Math.max(160, Math.round(value)));
}

function clampTargetFps(value: number): number {
  if (!Number.isFinite(value)) {
    return 30;
  }
  return Math.min(60, Math.max(1, Math.round(value)));
}

class StudioCameraRuntime {
  private cameraByNodeId = new Map<string, CameraState>();
  private textureByNodeId = new Map<string, VideoTextureState>();
  private hiddenVideoHost: HTMLDivElement | null = null;

  private ensureHiddenHost(): HTMLDivElement | null {
    if (typeof document === "undefined") {
      return null;
    }
    if (this.hiddenVideoHost == null) {
      const host = document.createElement("div");
      host.setAttribute("aria-hidden", "true");
      host.style.cssText =
        "position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";
      document.body.appendChild(host);
      this.hiddenVideoHost = host;
    }
    return this.hiddenVideoHost;
  }

  getCameraUiState(nodeId: string): Pick<CameraState, "enabled" | "status" | "errorMessage"> {
    const st = this.cameraByNodeId.get(nodeId);
    if (st == null) {
      return { enabled: false, status: "idle" };
    }
    return {
      enabled: st.enabled,
      status: st.status,
      errorMessage: st.errorMessage,
    };
  }

  getVideoElement(nodeId: string): HTMLVideoElement | null {
    return this.cameraByNodeId.get(nodeId)?.videoEl ?? null;
  }

  enableCamera(nodeId: string, enabled: boolean): void {
    const prev = this.cameraByNodeId.get(nodeId);
    const next: CameraState = prev ?? {
      enabled: false,
      status: "idle",
      deviceId: "default",
      facingMode: "user",
      width: 1280,
      height: 720,
      targetFps: 30,
      mirrorPreview: true,
    };
    next.enabled = enabled;
    if (!enabled && next.status === "active") {
      this.stopCamera(nodeId);
      next.status = "idle";
    }
    this.cameraByNodeId.set(nodeId, next);
  }

  async ensureCameraActive(
    nodeId: string,
    args: {
      deviceId: string;
      facingMode: "user" | "environment";
      width: number;
      height: number;
      targetFps: number;
      mirrorPreview: boolean;
    },
  ): Promise<void> {
    const st = this.cameraByNodeId.get(nodeId) ?? {
      enabled: false,
      status: "idle" as const,
      deviceId: "default",
      facingMode: "user" as const,
      width: 1280,
      height: 720,
      targetFps: 30,
      mirrorPreview: true,
    };
    st.deviceId = args.deviceId;
    st.facingMode = args.facingMode;
    st.width = clampDimension(args.width, 1280);
    st.height = clampDimension(args.height, 720);
    st.targetFps = clampTargetFps(args.targetFps);
    st.mirrorPreview = args.mirrorPreview;
    this.cameraByNodeId.set(nodeId, st);

    if (!st.enabled) {
      return;
    }

    if (st.status === "active" && st.videoEl != null && st.stream != null) {
      return;
    }

    st.status = "requesting";
    st.errorMessage = undefined;
    this.cameraByNodeId.set(nodeId, st);

    try {
      const deviceId = st.deviceId.trim();
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: st.width },
        height: { ideal: st.height },
        frameRate: { ideal: st.targetFps, max: st.targetFps },
        facingMode: st.facingMode,
      };
      if (deviceId.length > 0 && deviceId !== "default") {
        videoConstraints.deviceId = { exact: deviceId };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      const host = this.ensureHiddenHost();
      if (host == null) {
        stream.getTracks().forEach((t) => t.stop());
        st.status = "error";
        st.errorMessage = "Document unavailable for video preview.";
        return;
      }

      const videoEl = document.createElement("video");
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.autoplay = true;
      videoEl.srcObject = stream;
      host.appendChild(videoEl);

      await videoEl.play().catch(() => undefined);

      st.stream = stream;
      st.videoEl = videoEl;
      st.status = "active";
      st.errorMessage = undefined;
      st.fpsWindowStartMs = performance.now();
      st.fpsFrameCount = 0;
      st.measuredFps = 0;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      st.status = message.toLowerCase().includes("denied") ? "denied" : "error";
      st.errorMessage = message;
    }
  }

  stopCamera(nodeId: string): void {
    const st = this.cameraByNodeId.get(nodeId);
    if (st == null) {
      return;
    }

    try {
      st.stream?.getTracks().forEach((t) => t.stop());
    } catch {}

    try {
      st.videoEl?.remove();
    } catch {}

    for (const [textureNodeId, texState] of this.textureByNodeId.entries()) {
      if (texState.cameraNodeId === nodeId) {
        this.releaseVideoTexture(textureNodeId);
      }
    }

    delete st.stream;
    delete st.videoEl;
    delete st.fpsWindowStartMs;
    delete st.fpsFrameCount;
    delete st.measuredFps;
  }

  tickCameraFps(nodeId: string, nowMs: number): number {
    const st = this.cameraByNodeId.get(nodeId);
    if (st == null || st.status !== "active") {
      return 0;
    }
    const start = st.fpsWindowStartMs ?? nowMs;
    const count = (st.fpsFrameCount ?? 0) + 1;
    st.fpsFrameCount = count;
    const elapsed = nowMs - start;
    if (elapsed >= 1000) {
      st.measuredFps = (count * 1000) / Math.max(1, elapsed);
      st.fpsWindowStartMs = nowMs;
      st.fpsFrameCount = 0;
    }
    return st.measuredFps ?? 0;
  }

  getCameraDimensions(nodeId: string): { width: number; height: number } {
    const st = this.cameraByNodeId.get(nodeId);
    const video = st?.videoEl;
    if (video != null && video.videoWidth > 0 && video.videoHeight > 0) {
      return { width: video.videoWidth, height: video.videoHeight };
    }
    return { width: st?.width ?? 0, height: st?.height ?? 0 };
  }

  ensureVideoTexture(
    textureNodeId: string,
    cameraNodeId: string,
    args: { flipY: boolean },
  ): void {
    const cam = this.cameraByNodeId.get(cameraNodeId);
    const videoEl = cam?.videoEl;
    if (cam == null || cam.status !== "active" || videoEl == null) {
      this.releaseVideoTexture(textureNodeId);
      return;
    }

    let st = this.textureByNodeId.get(textureNodeId);
    const needsRebuild =
      st == null ||
      st.cameraNodeId !== cameraNodeId ||
      st.flipY !== args.flipY ||
      st.texture == null;

    if (needsRebuild) {
      this.releaseVideoTexture(textureNodeId);
      const texture = new THREE.VideoTexture(videoEl);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.flipY = args.flipY;
      st = {
        cameraNodeId,
        flipY: args.flipY,
        texture,
        ready: videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA,
      };
      this.textureByNodeId.set(textureNodeId, st);
      return;
    }

    st.ready = videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    if (st.texture != null) {
      st.texture.needsUpdate = true;
    }
  }

  isVideoTextureReady(textureNodeId: string): boolean {
    return this.textureByNodeId.get(textureNodeId)?.ready === true;
  }

  releaseVideoTexture(textureNodeId: string): void {
    const st = this.textureByNodeId.get(textureNodeId);
    if (st?.texture != null) {
      st.texture.dispose();
    }
    this.textureByNodeId.delete(textureNodeId);
  }
}

export const studioCameraRuntime = new StudioCameraRuntime();
