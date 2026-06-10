import { useEffect, useRef, useState } from "react";
import {
  gaugeNeedleSmoothingSettled,
  stepGaugeNeedleSmoothing,
} from "../../../../sensor-studio/features/editor/nodes/display/gauge-display-config";

export function useWidgetBoardSmoothedRatio(
  targetRatio: number,
  smoothingMs: number,
): number {
  const [displayRatio, setDisplayRatio] = useState(targetRatio);
  const smoothRef = useRef(targetRatio);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    if (smoothingMs <= 0) {
      smoothRef.current = targetRatio;
      setDisplayRatio(targetRatio);
      return;
    }

    let mounted = true;
    const tick = (ts: number) => {
      const last = lastTsRef.current ?? ts;
      lastTsRef.current = ts;
      const dt = ts - last;
      const next = stepGaugeNeedleSmoothing(smoothRef.current, targetRatio, dt, smoothingMs);
      smoothRef.current = next;
      if (mounted) {
        setDisplayRatio(next);
      }
      if (!gaugeNeedleSmoothingSettled(next, targetRatio, 0, 1)) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetRatio, smoothingMs]);

  return smoothingMs <= 0 ? targetRatio : displayRatio;
}
