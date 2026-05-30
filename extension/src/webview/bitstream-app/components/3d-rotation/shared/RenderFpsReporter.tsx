import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { PERF_REPORT_INTERVAL_MS } from "./rotationPreviewConstants.js";

export function RenderFpsReporter(props: { onFps: (fps: number) => void }) {
  const { onFps } = props;
  const frameCountRef = useRef(0);
  const lastReportAtRef = useRef(performance.now());
  useFrame(() => {
    frameCountRef.current += 1;
    const now = performance.now();
    const elapsed = now - lastReportAtRef.current;
    if (elapsed >= PERF_REPORT_INTERVAL_MS) {
      const fps = (frameCountRef.current * 1000) / elapsed;
      onFps(fps);
      frameCountRef.current = 0;
      lastReportAtRef.current = now;
    }
  });
  return null;
}
