import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { twMerge } from "tailwind-merge";

function clamp(n: number, min?: number, max?: number): number {
  let x = n;
  if (typeof min === "number" && Number.isFinite(min)) {
    x = Math.max(min, x);
  }
  if (typeof max === "number" && Number.isFinite(max)) {
    x = Math.min(max, x);
  }
  return x;
}

function coerceNumber(input: string, fallback: number): number {
  const v = Number(input);
  return Number.isFinite(v) ? v : fallback;
}

export const TRN_SCRUB_DEFAULT_ACTIVATION_THRESHOLD_PX = 4;

/** Pixels of horizontal drag for `0.001 * R` contribution (additive “0.1% of reference”). */
export const TRN_SCRUB_DEFAULT_HORIZONTAL_PX_PER_TENTH_PERCENT = 96;

/** Pixels of vertical drag (up) for `0.01 * R` contribution (additive “1% of reference”). */
export const TRN_SCRUB_DEFAULT_VERTICAL_PX_PER_PERCENT = 48;

/** Pixel-mode wheel: accumulate |deltaY| before emitting one ±1%-of-range step. */
export const TRN_SCRUB_WHEEL_PIXEL_ACCUM_THRESHOLD = 80;

/**
 * Optional drag / wheel tuning (constants live alongside below).
 * **Lower px** → same motion applies larger value deltas (“more sensitive”).
 */
export type TRNScrubInteractionConfig = {
  /** Horizontal drag distance (px) mapped to one “0.1% of reference” unit; lower = faster. */
  horizontalPxPerTenthPercent?: number;
  /** Vertical drag distance (px) mapped to one “1% of reference” unit; lower = faster. */
  verticalPxPerPercent?: number;
  /** Pointer movement threshold (px) before scrubbing starts. */
  scrubActivationThresholdPx?: number;
  /** Pixel-mode wheel: accumulate |deltaY| before one ±1%-of-range step; lower = faster. */
  wheelPixelAccumThreshold?: number;
};

export type TRNScrubNumberInputProps = TRNScrubInteractionConfig & {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  locked?: boolean;
  /**
   * When true, horizontal pointer drag and wheel adjust the value (legacy scrub UX).
   * Default **false** — type digits or use Arrow Up/Down only.
   */
  pointerScrubEnabled?: boolean;
  /** Minimum magnitude used as scrub reference when `|value|` is tiny. */
  scrubEpsilon?: number;
  /** Fixed fractional digits (overrides span/step heuristic). */
  fractionDigits?: number;
  id?: string;
  className?: string;
  inputClassName?: string;
  "aria-label"?: string;
};

function finiteSpan(min?: number, max?: number): number | null {
  if (
    typeof min !== "number" ||
    typeof max !== "number" ||
    !Number.isFinite(min) ||
    !Number.isFinite(max)
  ) {
    return null;
  }
  const span = max - min;
  return span > 0 ? span : null;
}

/** Infer decimal places from numeric `step` (e.g. 0.01 → 2, 0.5 → 1). */
export function trnFractionDigitsFromStep(step: number): number {
  if (!Number.isFinite(step) || step <= 0) {
    return 2;
  }
  const tol = 1e-10;
  for (let d = 0; d <= 10; d++) {
    const rounded = Math.round(step * 10 ** d) / 10 ** d;
    if (Math.abs(rounded - step) <= tol) {
      return d;
    }
  }
  return 4;
}

/**
 * Readable display decimals: span-based `ceil(4 - log10(S))` when `min`/`max` imply positive span,
 * else `max(2, digits inferred from step)`.
 */
export function computeTrnScrubDisplayDecimals(
  min?: number,
  max?: number,
  step: number = 0.01,
  fractionDigitsOverride?: number,
): number {
  if (
    fractionDigitsOverride != null &&
    Number.isFinite(fractionDigitsOverride) &&
    fractionDigitsOverride >= 0
  ) {
    return Math.max(0, Math.min(8, Math.round(fractionDigitsOverride)));
  }
  const span = finiteSpan(min, max);
  if (span != null) {
    const d = Math.ceil(4 - Math.log10(span));
    return Math.max(2, Math.min(6, d));
  }
  const fd = trnFractionDigitsFromStep(step);
  return Math.max(2, Math.min(6, Math.max(fd, 2)));
}

export function formatTrnScrubDisplayValue(
  value: number,
  decimals: number,
  nearZeroEps: number,
): string {
  if (!Number.isFinite(value)) {
    return (0).toFixed(decimals);
  }
  if (Math.abs(value) < nearZeroEps) {
    return (0).toFixed(decimals);
  }
  return value.toFixed(decimals);
}

function wheelModifier(e: Pick<ReactWheelEvent<HTMLElement>, "shiftKey" | "ctrlKey" | "metaKey">): number {
  let mod = 1;
  if (e.shiftKey) {
    mod *= 0.1;
  }
  if (e.ctrlKey || e.metaKey) {
    mod *= 10;
  }
  return mod;
}

type ScrubSession = {
  pointerId: number;
  startX: number;
  startY: number;
  v0: number;
  scrubbing: boolean;
  target: HTMLInputElement;
};

export function TRNScrubNumberInput(props: TRNScrubNumberInputProps) {
  const {
    value,
    onChange,
    step,
    min,
    max,
    disabled = false,
    locked = false,
    pointerScrubEnabled = false,
    scrubEpsilon = 1e-9,
    fractionDigits,
    horizontalPxPerTenthPercent = TRN_SCRUB_DEFAULT_HORIZONTAL_PX_PER_TENTH_PERCENT,
    verticalPxPerPercent = TRN_SCRUB_DEFAULT_VERTICAL_PX_PER_PERCENT,
    scrubActivationThresholdPx = TRN_SCRUB_DEFAULT_ACTIVATION_THRESHOLD_PX,
    wheelPixelAccumThreshold = TRN_SCRUB_WHEEL_PIXEL_ACCUM_THRESHOLD,
    id,
    className = "",
    inputClassName = "",
    "aria-label": ariaLabel,
  } = props;

  const effectiveStep = useMemo(() => {
    if (typeof step === "number" && Number.isFinite(step) && step > 0) {
      return step;
    }
    const span = finiteSpan(min, max);
    if (span != null) {
      return Math.max(1e-6, span / 256);
    }
    return 1;
  }, [max, min, step]);

  const displayDecimals = useMemo(
    () => computeTrnScrubDisplayDecimals(min, max, effectiveStep, fractionDigits),
    [effectiveStep, fractionDigits, max, min],
  );

  const nearZeroEps = useMemo(
    () => 10 ** -(displayDecimals + 1),
    [displayDecimals],
  );

  const formattedBlurred = useMemo(() => {
    const v = Number.isFinite(value) ? value : 0;
    return formatTrnScrubDisplayValue(v, displayDecimals, nearZeroEps);
  }, [displayDecimals, nearZeroEps, value]);

  const fullPrecisionTitle = useMemo(() => {
    const v = Number.isFinite(value) ? value : 0;
    return String(v);
  }, [value]);

  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(formattedBlurred);

  const sessionRef = useRef<ScrubSession | null>(null);
  const moveCleanupRef = useRef<(() => void) | null>(null);
  const wheelPixelAccumRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  /** After flushing draft on pointer down, skip duplicate parse on the scrub-induced blur. */
  const suppressBlurCommitRef = useRef(false);
  const detachWindowListeners = useCallback(() => {
    moveCleanupRef.current?.();
    moveCleanupRef.current = null;
  }, []);

  const applyScrubDelta = useCallback(
    (e: PointerEvent, s: ScrubSession) => {
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      const R = Math.max(Math.abs(s.v0), scrubEpsilon);
      let mod = 1;
      if (e.shiftKey) {
        mod *= 0.1;
      }
      if (e.ctrlKey || e.metaKey) {
        mod *= 10;
      }
      const hPx = Math.max(horizontalPxPerTenthPercent, 1e-6);
      const vPx = Math.max(verticalPxPerPercent, 1e-6);
      const delta =
        R *
        mod *
        ((dx / hPx) * 0.001 + ((-dy) / vPx) * 0.01);
      const next = clamp(s.v0 + delta, min, max);
      onChange(next);
    },
    [
      horizontalPxPerTenthPercent,
      max,
      min,
      onChange,
      scrubEpsilon,
      verticalPxPerPercent,
    ],
  );

  const setDraftFromNumber = useCallback(
    (n: number) => {
      const v = Number.isFinite(n) ? n : 0;
      setDraft(formatTrnScrubDisplayValue(v, displayDecimals, nearZeroEps));
    },
    [displayDecimals, nearZeroEps],
  );

  // When blurred, the input renders `formattedBlurred` directly, so there is no need to
  // sync `draft` (which can create update loops during high-frequency external updates).

  useEffect(() => {
    return () => {
      const s = sessionRef.current;
      if (s != null && s.scrubbing && s.target.hasPointerCapture(s.pointerId)) {
        s.target.releasePointerCapture(s.pointerId);
      }
      sessionRef.current = null;
      detachWindowListeners();
    };
  }, [detachWindowListeners]);

  const onPointerDown = (e: ReactPointerEvent<HTMLInputElement>) => {
    if (!pointerScrubEnabled || e.button !== 0 || disabled || locked) {
      return;
    }
    const target = e.currentTarget;
    suppressBlurCommitRef.current = false;

    let v0 = Number.isFinite(value) ? value : 0;
    if (focused && !locked && !disabled) {
      const parsed = coerceNumber(draft, v0);
      v0 = clamp(parsed, min, max);
      onChange(v0);
      setDraftFromNumber(v0);
      /** Do not set **`suppressBlurCommitRef`** here — caret clicks would skip the next Enter/blur commit. */
    }

    sessionRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      v0,
      scrubbing: false,
      target,
    };

    const onMove = (evt: PointerEvent) => {
      const s = sessionRef.current;
      if (s == null || evt.pointerId !== s.pointerId) {
        return;
      }
      const dx = evt.clientX - s.startX;
      const dy = evt.clientY - s.startY;
      if (!s.scrubbing) {
        const thr = Math.max(0, scrubActivationThresholdPx);
        if (dx * dx + dy * dy < thr * thr) {
          return;
        }
        s.scrubbing = true;
        s.target.setPointerCapture(s.pointerId);
        evt.preventDefault();
        suppressBlurCommitRef.current = true;
        s.target.blur();
      }
      evt.preventDefault();
      applyScrubDelta(evt, s);
    };

    const onUpOrCancel = (evt: PointerEvent) => {
      const s = sessionRef.current;
      if (s == null || evt.pointerId !== s.pointerId) {
        return;
      }
      if (s.scrubbing && s.target.hasPointerCapture(s.pointerId)) {
        s.target.releasePointerCapture(s.pointerId);
      }
      sessionRef.current = null;
      detachWindowListeners();
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUpOrCancel);
    window.addEventListener("pointercancel", onUpOrCancel);
    moveCleanupRef.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUpOrCancel);
      window.removeEventListener("pointercancel", onUpOrCancel);
    };
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || locked) {
      return;
    }
    const mult = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = clamp(value + effectiveStep * mult, min, max);
      onChange(next);
      setDraftFromNumber(next);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = clamp(value - effectiveStep * mult, min, max);
      onChange(next);
      setDraftFromNumber(next);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (!suppressBlurCommitRef.current) {
        const raw = e.currentTarget.value;
        const parsed = coerceNumber(raw, Number.isFinite(value) ? value : 0);
        onChange(clamp(parsed, min, max));
        suppressBlurCommitRef.current = true;
      }
      e.currentTarget.blur();
    }
  };

  const onWheelNative = useCallback(
    (e: WheelEvent) => {
      if (!pointerScrubEnabled || disabled || locked) {
        return;
      }
      if (e.deltaY === 0) {
        return;
      }

      // React's synthetic onWheel is passive in some builds; use a native listener (passive: false).
      e.preventDefault();
      e.stopPropagation();

      const mod = wheelModifier(e);
      const span = finiteSpan(min, max);
      const stepAbs = (span != null ? span * 0.01 : 1) * mod;

      let signedLineSteps = 0;
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        const lines = Math.max(1, Math.round(Math.abs(e.deltaY)));
        signedLineSteps = Math.sign(-e.deltaY) * lines;
      } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        signedLineSteps = Math.sign(-e.deltaY);
      } else {
        if (span == null) {
          const dir = Math.sign(-e.deltaY);
          const next = clamp(value + dir * stepAbs, min, max);
          if (next !== value) {
            onChange(next);
            setDraftFromNumber(next);
          }
          return;
        }
        wheelPixelAccumRef.current += e.deltaY;
        const thr = Math.max(1, wheelPixelAccumThreshold);
        let v = Number.isFinite(value) ? value : 0;
        let changed = false;
        while (Math.abs(wheelPixelAccumRef.current) >= thr) {
          let dir: number;
          if (wheelPixelAccumRef.current > 0) {
            wheelPixelAccumRef.current -= thr;
            dir = -1;
          } else {
            wheelPixelAccumRef.current += thr;
            dir = 1;
          }
          const next = clamp(v + dir * stepAbs, min, max);
          if (next !== v) {
            changed = true;
          }
          v = next;
        }
        if (changed) {
          onChange(v);
          setDraftFromNumber(v);
        }
        return;
      }

      const delta = signedLineSteps * stepAbs;
      const next = clamp(value + delta, min, max);
      onChange(next);
      setDraftFromNumber(next);
    },
    [
      disabled,
      locked,
      max,
      min,
      onChange,
      pointerScrubEnabled,
      setDraftFromNumber,
      value,
      wheelPixelAccumThreshold,
    ],
  );

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheelNative as any);
    };
  }, [onWheelNative]);

  const readOnly = locked;
  const displayStr = focused ? draft : formattedBlurred;

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      aria-readonly={locked ? true : undefined}
      className={twMerge(
        "nodrag nopan nowheel [-moz-appearance:textfield] min-w-0 flex-1 appearance-none bg-transparent text-right text-[11px] text-zinc-100 outline-none",
        "[&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none",
        "[&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none",
        locked
          ? "cursor-not-allowed text-zinc-400"
          : pointerScrubEnabled
            ? "cursor-ew-resize"
            : "cursor-text",
        inputClassName,
        className.length > 0 ? className : false,
      )}
      value={displayStr}
      disabled={disabled}
      readOnly={readOnly}
      autoComplete="off"
      spellCheck={false}
      onFocus={() => {
        if (locked || disabled) {
          return;
        }
        setFocused(true);
        setDraft(formattedBlurred);
      }}
      onBlur={(e) => {
        wheelPixelAccumRef.current = 0;
        if (!locked && !disabled && !suppressBlurCommitRef.current) {
          const raw = e.currentTarget.value;
          const parsed = coerceNumber(raw, Number.isFinite(value) ? value : 0);
          onChange(clamp(parsed, min, max));
        }
        suppressBlurCommitRef.current = false;
        setFocused(false);
      }}
      onPointerDown={onPointerDown}
      onMouseUp={(e) => {
        if (disabled || locked) {
          return;
        }
        // Click-to-replace: when the pointer did not enter scrub mode, select all on release.
        const s = sessionRef.current;
        if (s != null && s.scrubbing) {
          return;
        }
        // Only on primary click.
        if (e.button !== 0) {
          return;
        }
        e.currentTarget.select();
      }}
      onChange={(ev) => {
        if (locked) {
          return;
        }
        const raw = ev.currentTarget.value;
        setDraft(raw);
      }}
      onKeyDown={onKeyDown}
    />
  );
}
