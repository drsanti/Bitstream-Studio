import { useEffect, useRef, useState } from "react";
import type { VisionPoseSketchSpec } from "../../core/camera/collect-vision-pose-sketches";
import { studioVisionLandmarkCache } from "../../core/camera/studio-vision-landmark-cache";
import {
  mapLandmarksToSketchPoints,
  objectContainVideoRect,
  objectCoverVideoRect,
  sketchPointToSvg,
  VISION_POSE_SKETCH_CONNECTIONS,
} from "../../core/camera/vision-pose-sketch";

export function VisionPoseSketchSvgLayer(props: {
  specs: readonly VisionPoseSketchSpec[];
  className?: string;
  /** When set, landmark coords are mapped into the video's object-fit letterbox. */
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  videoObjectFit?: "contain" | "cover";
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const el = hostRef.current;
    if (el == null) {
      return;
    }
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    setSize({ w: rect.width, h: rect.height });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick((t) => (t + 1) % 100000);
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  void tick;

  const videoEl = props.videoRef?.current ?? null;
  const fit = props.videoObjectFit ?? "contain";
  const contentRect =
    videoEl != null && size.w > 0 && size.h > 0
      ? (fit === "cover" ? objectCoverVideoRect : objectContainVideoRect)({
          containerW: size.w,
          containerH: size.h,
          videoW: videoEl.videoWidth,
          videoH: videoEl.videoHeight,
        })
      : undefined;

  if (props.specs.length === 0 || size.w <= 0 || size.h <= 0) {
    return (
      <div
        ref={hostRef}
        className={props.className ?? "pointer-events-none absolute inset-0"}
        aria-hidden
      />
    );
  }

  return (
    <div
      ref={hostRef}
      className={props.className ?? "pointer-events-none absolute inset-0 overflow-hidden"}
      aria-hidden
    >
      <svg className="h-full w-full" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden>
        {props.specs.map((spec) => {
          const landmarks = studioVisionLandmarkCache.getLandmarks(spec.visionNodeId);
          const points = mapLandmarksToSketchPoints(landmarks);
          if (points.length === 0) {
            return null;
          }
          const mapped = points.map((point) =>
            sketchPointToSvg({
              point,
              width: size.w,
              height: size.h,
              mirror: spec.mirrorPreview,
              minVisibility: spec.minVisibility,
              contentRect,
            }),
          );
          return (
            <g key={spec.visionNodeId}>
              {VISION_POSE_SKETCH_CONNECTIONS.map(([a, b]) => {
                const pa = mapped[a];
                const pb = mapped[b];
                if (pa == null || pb == null || !pa.visible || !pb.visible) {
                  return null;
                }
                return (
                  <line
                    key={`${spec.visionNodeId}-${a}-${b}`}
                    x1={pa.cx}
                    y1={pa.cy}
                    x2={pb.cx}
                    y2={pb.cy}
                    stroke="rgba(52, 211, 153, 0.9)"
                    strokeWidth={2}
                  />
                );
              })}
              {mapped.map((p, i) =>
                p.visible ? (
                  <circle
                    key={`${spec.visionNodeId}-pt-${i}`}
                    cx={p.cx}
                    cy={p.cy}
                    r={3}
                    fill="rgba(110, 231, 183, 0.95)"
                  />
                ) : null,
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
