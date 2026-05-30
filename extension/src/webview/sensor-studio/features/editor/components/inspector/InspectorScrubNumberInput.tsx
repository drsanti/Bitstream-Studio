import { useCallback, useEffect, useRef, useState } from "react";

export type InspectorScrubNumberInputProps = {
  value: number;
  onCommit: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
  "aria-label"?: string;
};

function clampNumber(n: number, min?: number, max?: number): number {
  let x = n;
  if (typeof min === "number" && Number.isFinite(min)) {
    x = Math.max(min, x);
  }
  if (typeof max === "number" && Number.isFinite(max)) {
    x = Math.min(max, x);
  }
  return x;
}

const SCRUB_THRESHOLD_PX = 5;

/**
 * Number field with vertical drag-to-scrub; commits once on pointer up (one undo step with store updates).
 */
export function InspectorScrubNumberInput(props: InspectorScrubNumberInputProps) {
  const {
    value,
    onCommit,
    step = 0.01,
    min,
    max,
    className,
    "aria-label": ariaLabel,
  } = props;
  const [display, setDisplay] = useState(String(value));
  const scrubRef = useRef<{
    pointerId: number;
    originY: number;
    originValue: number;
    active: boolean;
  } | null>(null);

  useEffect(() => {
    if (scrubRef.current == null || !scrubRef.current.active) {
      setDisplay(String(value));
    }
  }, [value]);

  const endScrub = useCallback(() => {
    scrubRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLInputElement>) => {
      if (e.button !== 0) {
        return;
      }
      const el = e.currentTarget;
      scrubRef.current = {
        pointerId: e.pointerId,
        originY: e.clientY,
        originValue: value,
        active: false,
      };
      el.setPointerCapture(e.pointerId);
    },
    [value],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLInputElement>) => {
      const s = scrubRef.current;
      if (s == null || e.pointerId !== s.pointerId) {
        return;
      }
      const dy = s.originY - e.clientY;
      if (!s.active) {
        if (Math.abs(dy) < SCRUB_THRESHOLD_PX) {
          return;
        }
        s.active = true;
        e.preventDefault();
      }
      const fine = e.shiftKey ? step * 0.1 : step;
      const next = clampNumber(s.originValue + dy * fine, min, max);
      setDisplay(String(next));
    },
    [step, min, max],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLInputElement>) => {
      const s = scrubRef.current;
      if (s == null || e.pointerId !== s.pointerId) {
        return;
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (s.active) {
        const parsed = Number(display);
        if (Number.isFinite(parsed)) {
          onCommit(clampNumber(parsed, min, max));
        }
      }
      endScrub();
    },
    [display, onCommit, endScrub, min, max],
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLInputElement>) => {
      const s = scrubRef.current;
      if (s == null || e.pointerId !== s.pointerId) {
        return;
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setDisplay(String(value));
      endScrub();
    },
    [value, endScrub],
  );

  return (
    <input
      type="number"
      aria-label={ariaLabel}
      className={className}
      value={display}
      step={step}
      min={min}
      max={max}
      onChange={(ev) => {
        setDisplay(ev.target.value);
        const n = Number(ev.target.value);
        if (Number.isFinite(n)) {
          onCommit(clampNumber(n, min, max));
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      title="Drag vertically to scrub; Shift for finer steps"
    />
  );
}
