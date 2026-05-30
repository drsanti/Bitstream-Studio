import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { gsap } from "gsap";
import { twMerge } from "tailwind-merge";
import { TRNRangeSlider } from "./TRNRangeSlider";

/**
 * Match `TRNParameter` `appearance` tokens. **`divider`** aligns with `TRNParameter` `divider` HUD
 * rows (3D telemetry toolbox): `text-[11px]`, muted label, `tabular-nums` value.
 */
export type TRNParameterSliderAppearance = "default" | "divider";

type TRNParameterSliderProps = {
  name: ReactNode;
  /** Native tooltip on the label (e.g. when `name` is shortened). */
  nameTitle?: string;
  nameTrailingSlot?: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  valueFormatter?: (value: number) => ReactNode;
  throttleMs?: number;
  animateExternalValueChange?: boolean;
  animationDurationMs?: number;
  animationEase?: string;
  unit?: ReactNode;
  icon?: ReactNode;
  className?: string;
  sliderClassName?: string;
  /** When true, slider is non-interactive and the row is visually dimmed. */
  disabled?: boolean;
  /** Default `default`. Use `divider` for the same rhythm as `TRNParameter` divider rows. */
  appearance?: TRNParameterSliderAppearance;
  /**
   * When true, drag vertically on the value readout (right column) adjusts the parameter like the
   * slider (same throttling). Shift increases sensitivity slightly.
   */
  valueScrubEnabled?: boolean;
};

const VALUE_SCRUB_THRESHOLD_PX = 5;

function snapScalarToStep(v: number, step: number, min: number, max: number): number {
  const c = Math.min(max, Math.max(min, v));
  if (!Number.isFinite(step) || step <= 0) {
    return c;
  }
  const snapped = Math.round(c / step) * step;
  const s = String(step);
  const dot = s.indexOf(".");
  const decimals =
    dot < 0 ? 0 : Math.min(8, Math.max(0, s.length - dot - 1));
  return Number(snapped.toFixed(decimals));
}

const APPEARANCE_ROOT: Record<TRNParameterSliderAppearance, string> = {
  default: "flex flex-col gap-2 px-2 py-1 text-sm",
  divider: "flex flex-col gap-2 px-0 py-1.5 text-[11px] font-normal leading-snug",
};

const APPEARANCE_NAME: Record<TRNParameterSliderAppearance, string> = {
  default:
    "min-w-0 flex-1 wrap-break-word text-xs font-semibold leading-snug normal-case tracking-normal text-zinc-100",
  divider:
    "min-w-0 flex-1 wrap-break-word text-[11px] font-normal leading-snug normal-case tracking-normal text-zinc-400",
};

const APPEARANCE_ICON: Record<TRNParameterSliderAppearance, string> = {
  default: "text-zinc-400",
  divider: "text-zinc-500",
};

const APPEARANCE_VALUE: Record<TRNParameterSliderAppearance, string> = {
  default:
    "min-w-14 whitespace-nowrap text-right text-xs leading-none font-semibold tabular-nums text-zinc-100",
  divider:
    "min-w-14 whitespace-nowrap text-right font-semibold tabular-nums text-zinc-50",
};

const APPEARANCE_UNIT: Record<TRNParameterSliderAppearance, string> = {
  default: "whitespace-nowrap text-right text-zinc-300",
  divider: "whitespace-nowrap text-right text-zinc-400",
};

const APPEARANCE_SLIDER_PAD: Record<TRNParameterSliderAppearance, string> = {
  default: "pb-2",
  divider: "pb-1.5",
};

export const TRNParameterSlider = ({
  name,
  nameTitle,
  nameTrailingSlot,
  value,
  min,
  max,
  step = 1,
  onChange,
  valueFormatter,
  throttleMs = 500,
  animateExternalValueChange = true,
  animationDurationMs = 220,
  animationEase = "power2.out",
  unit,
  icon,
  className = "",
  sliderClassName = "",
  disabled = false,
  appearance = "default",
  valueScrubEnabled = false,
}: TRNParameterSliderProps) => {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<number | null>(null);
  const lastEmitAtRef = useRef(0);
  const localValueRef = useRef(value);
  const valueTweenStateRef = useRef<{ value: number } | null>(null);
  const valueScrubRef = useRef<{
    pointerId: number;
    originY: number;
    originValue: number;
    active: boolean;
  } | null>(null);

  useEffect(() => {
    localValueRef.current = localValue;
  }, [localValue]);

  useEffect(() => {
    const current = localValueRef.current;
    if (Math.abs(value - current) <= Number.EPSILON) {
      return;
    }

    // Avoid fighting with the local throttled drag flow.
    if (pendingValueRef.current != null) {
      return;
    }

    if (valueTweenStateRef.current != null) {
      gsap.killTweensOf(valueTweenStateRef.current);
      valueTweenStateRef.current = null;
    }

    if (!animateExternalValueChange || animationDurationMs <= 0) {
      setLocalValue(value);
      localValueRef.current = value;
      return;
    }

    const tweenState = { value: current };
    valueTweenStateRef.current = tweenState;
    gsap.to(tweenState, {
      value,
      duration: Math.max(0.05, animationDurationMs / 1000),
      ease: animationEase,
      onUpdate: () => {
        localValueRef.current = tweenState.value;
        setLocalValue(tweenState.value);
      },
      onComplete: () => {
        localValueRef.current = value;
        setLocalValue(value);
        valueTweenStateRef.current = null;
      },
    });
  }, [animateExternalValueChange, animationDurationMs, animationEase, value]);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
      }
      if (valueTweenStateRef.current != null) {
        gsap.killTweensOf(valueTweenStateRef.current);
        valueTweenStateRef.current = null;
      }
    };
  }, []);

  const emitNow = (nextValue: number) => {
    onChange(nextValue);
    lastEmitAtRef.current = Date.now();
  };

  const flushThrottle = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingValueRef.current != null) {
      const pending = pendingValueRef.current;
      pendingValueRef.current = null;
      emitNow(pending);
    }
  };

  const commitLocalAndScheduleEmit = (rawNext: number) => {
    const stepped = snapScalarToStep(rawNext, step, min, max);
    setLocalValue(stepped);
    localValueRef.current = stepped;

    if (throttleMs <= 0) {
      pendingValueRef.current = null;
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      emitNow(stepped);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastEmitAtRef.current;
    if (lastEmitAtRef.current === 0 || elapsed >= throttleMs) {
      pendingValueRef.current = null;
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      emitNow(stepped);
      return;
    }

    pendingValueRef.current = stepped;
    if (timerRef.current == null) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (pendingValueRef.current == null) {
          return;
        }
        const pending = pendingValueRef.current;
        pendingValueRef.current = null;
        emitNow(pending);
      }, Math.max(0, throttleMs - elapsed));
    }
  };

  const onValueScrubPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || !valueScrubEnabled || e.button !== 0) {
      return;
    }
    flushThrottle();
    e.currentTarget.setPointerCapture(e.pointerId);
    valueScrubRef.current = {
      pointerId: e.pointerId,
      originY: e.clientY,
      originValue: localValueRef.current,
      active: false,
    };
  };

  const onValueScrubPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = valueScrubRef.current;
    if (s == null || e.pointerId !== s.pointerId) {
      return;
    }
    const dy = s.originY - e.clientY;
    if (!s.active) {
      if (Math.abs(dy) < VALUE_SCRUB_THRESHOLD_PX) {
        return;
      }
      s.active = true;
      e.preventDefault();
    }
    const range = max - min;
    const fine = e.shiftKey ? 1.35 : 1;
    const deltaVal = range > 0 ? ((dy / 140) * range) / fine : 0;
    const raw = s.originValue + deltaVal;
    commitLocalAndScheduleEmit(raw);
  };

  const endValueScrub = (e: PointerEvent<HTMLDivElement>) => {
    const s = valueScrubRef.current;
    if (s == null || e.pointerId !== s.pointerId) {
      return;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    valueScrubRef.current = null;
    flushThrottle();
  };

  const displayValue =
    valueFormatter != null
      ? valueFormatter(localValue)
      : localValue > 0
        ? `+${localValue}`
        : `${localValue}`;

  return (
    <div
      className={twMerge(
        APPEARANCE_ROOT[appearance],
        disabled && "opacity-50",
        className,
      )}
    >
      <div className="group flex flex-row items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-row items-start gap-2">
          {icon != null ? (
            <div
              className={twMerge(
                "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-start font-bold text-left",
                APPEARANCE_ICON[appearance],
              )}
            >
              {icon}
            </div>
          ) : null}
          <div className={twMerge(APPEARANCE_NAME[appearance])} title={nameTitle}>
            {name}
          </div>
          {nameTrailingSlot != null ? (
            <div className="inline-flex shrink-0 items-center">{nameTrailingSlot}</div>
          ) : null}
        </div>

        <div
          className={twMerge(
            "flex shrink-0 flex-row items-center justify-end gap-2",
            valueScrubEnabled && !disabled && "cursor-ns-resize touch-none select-none",
          )}
          title={
            valueScrubEnabled && !disabled
              ? "Drag vertically to adjust; Shift for finer steps"
              : undefined
          }
          onPointerDown={valueScrubEnabled && !disabled ? onValueScrubPointerDown : undefined}
          onPointerMove={valueScrubEnabled && !disabled ? onValueScrubPointerMove : undefined}
          onPointerUp={valueScrubEnabled && !disabled ? endValueScrub : undefined}
          onPointerCancel={valueScrubEnabled && !disabled ? endValueScrub : undefined}
        >
          <span className={twMerge(APPEARANCE_VALUE[appearance])}>{displayValue}</span>
          {unit != null ? (
            <span className={twMerge(APPEARANCE_UNIT[appearance])}>{unit}</span>
          ) : null}
        </div>
      </div>

      <TRNRangeSlider
        className={twMerge(
          "min-w-0 w-full [&_input:focus]:outline-none [&_input:focus-visible]:outline-none",
          APPEARANCE_SLIDER_PAD[appearance],
          sliderClassName,
        )}
        min={min}
        max={max}
        step={step}
        value={localValue}
        disabled={disabled}
        onChange={(event) => {
          const nextValue = Number(event.currentTarget.value);
          commitLocalAndScheduleEmit(nextValue);
        }}
      />
    </div>
  );
};
