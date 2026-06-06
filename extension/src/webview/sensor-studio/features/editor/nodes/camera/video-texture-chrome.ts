import { useEffect, useState } from "react";
import { studioCameraRuntime } from "../../../../core/camera/studio-camera-runtime";
import type { FlowNodeHeaderBadgeTone } from "../flow-node/FlowNodeHeaderBadge";

export function useVideoTextureReadyUi(textureNodeId: string): boolean {
  const [ready, setReady] = useState(() =>
    studioCameraRuntime.isVideoTextureReady(textureNodeId),
  );

  useEffect(() => {
    const t = window.setInterval(() => {
      setReady(studioCameraRuntime.isVideoTextureReady(textureNodeId));
    }, 250);
    return () => window.clearInterval(t);
  }, [textureNodeId]);

  return ready;
}

export function resolveVideoTextureHeaderBadge(ready: boolean): {
  label: string;
  tone: FlowNodeHeaderBadgeTone;
  pulseDot: boolean;
} {
  if (ready) {
    return { label: "Ready", tone: "live", pulseDot: false };
  }
  return { label: "Waiting", tone: "neutral", pulseDot: false };
}
