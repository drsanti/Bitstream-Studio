import { useEffect, useMemo, useRef } from "react";
import type { Css3dCameraFeedSpec } from "../camera/studio-camera-css3d-feed";
import { collectVisionPoseSketchSpecsForCamera } from "../camera/collect-vision-pose-sketches";
import { studioCameraRuntime } from "../camera/studio-camera-runtime";
import { VisionPoseSketchSvgLayer } from "./VisionPoseSketchSvgLayer";

type SketchFlowNode = {
  id: string;
  data: {
    nodeId: string;
    defaultConfig: Record<string, unknown>;
  };
};

type SketchFlowEdge = {
  source: string;
  target: string;
  targetHandle?: string | null;
  sourceHandle?: string | null;
};

function ViewportCameraFeedVideo(props: {
  cameraNodeId: string;
  className?: string;
  style?: React.CSSProperties;
  sketchSpecs: ReturnType<typeof collectVisionPoseSketchSpecsForCamera>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boundStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el == null) {
      return;
    }

    const attachStream = (stream: MediaStream) => {
      const target = videoRef.current;
      if (target == null) {
        return;
      }
      if (boundStreamRef.current !== stream) {
        boundStreamRef.current = stream;
        target.srcObject = stream;
        void target.play().catch(() => undefined);
      }
    };

    const initialStream = studioCameraRuntime.getCameraStream(props.cameraNodeId);
    if (initialStream != null) {
      attachStream(initialStream);
    }

    const pollMs = window.setInterval(() => {
      const stream = studioCameraRuntime.getCameraStream(props.cameraNodeId);
      if (stream != null) {
        attachStream(stream);
      }
    }, 500);

    return () => {
      window.clearInterval(pollMs);
      boundStreamRef.current = null;
    };
  }, [props.cameraNodeId]);

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        className={props.className}
        style={props.style}
        muted
        playsInline
        autoPlay
      />
      {props.sketchSpecs.length > 0 ? (
        <VisionPoseSketchSvgLayer
          specs={props.sketchSpecs}
          videoRef={videoRef}
          videoObjectFit="cover"
        />
      ) : null}
    </div>
  );
}

export function StudioCameraCss3dFeedsOverlay(props: {
  feeds: Css3dCameraFeedSpec[] | undefined;
  sketchFlowNodes?: readonly SketchFlowNode[];
  sketchFlowEdges?: readonly SketchFlowEdge[];
}) {
  const sketchSpecsByCamera = useMemo(() => {
    const nodes = props.sketchFlowNodes ?? [];
    const edges = props.sketchFlowEdges;
    const map = new Map<string, ReturnType<typeof collectVisionPoseSketchSpecsForCamera>>();
    for (const feed of props.feeds ?? []) {
      if (map.has(feed.cameraNodeId)) {
        continue;
      }
      map.set(
        feed.cameraNodeId,
        collectVisionPoseSketchSpecsForCamera(nodes, feed.cameraNodeId, edges),
      );
    }
    return map;
  }, [props.feeds, props.sketchFlowEdges, props.sketchFlowNodes]);

  const screenFeeds = (props.feeds ?? []).filter(
    (feed) => feed.anchorMode === "screen" && feed.visible && feed.opacity > 0,
  );
  if (screenFeeds.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[11] overflow-hidden">
      {screenFeeds.map((feed) => {
        const leftPct = Math.max(0, Math.min(100, feed.anchor.x * 100));
        const topPct = Math.max(0, Math.min(100, feed.anchor.y * 100));
        return (
          <div
            key={feed.feedNodeId}
            className="absolute overflow-hidden border border-zinc-600/70 bg-black/80 shadow-lg"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: feed.sizePx.w,
              height: feed.sizePx.h,
              borderRadius: feed.borderRadiusPx,
              opacity: feed.opacity,
              transform: "translate(-50%, -50%)",
            }}
          >
            <ViewportCameraFeedVideo
              cameraNodeId={feed.cameraNodeId}
              className="h-full w-full object-cover"
              sketchSpecs={sketchSpecsByCamera.get(feed.cameraNodeId) ?? []}
            />
          </div>
        );
      })}
    </div>
  );
}
