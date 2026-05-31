import type { CSSProperties, ReactNode, RefObject } from "react";
import { useMemo, useRef } from "react";
import { TRNTooltip } from "./TRNTooltip";
import type { SensorTelemetryIconPulseAnimationPreset } from "../../bitstream-app/config/sensorTelemetryUiConfig.js";
import {
  DEFAULT_TRN_ICON_PULSE_PEAK_COLOR_HEX,
} from "./trnIconPulsePresets.js";
import {
  useGsapIconPulseOnValueChange,
  type TRNParameterIconPulseStyle,
} from "./useGsapIconPulseOnValueChange.js";

const DEFAULT_ICON_PULSE_THROTTLE_MS = 280;

export type { TRNParameterIconPulseStyle };

/** `fixed` = 60px label column (default). `auto` = width follows label text, capped so value/gauge keep space. */
export type TRNParameterNameColumnLayout = "fixed" | "auto";

/**
 * `fixed` (default) = value + unit sit in a 100px-wide block (dense toolbars).
 * `auto` = value + unit use remaining row width (`flex-1 min-w-0`), e.g. grid cells in Diagnostics Snapshot.
 */
export type TRNParameterValueColumnLayout = "fixed" | "auto";

/**
 * `always` (default) = prefix positive numbers with `+` (signed / delta style).
 * `omit` = no `+` on positive values (unsigned magnitudes, strictly non-negative metrics).
 */
export type TRNParameterPositiveSignMode = "always" | "omit";

/**
 * Row chrome and typography tokens for HUD vs dense cards.
 * - **`card`** — bordered inset row (default; Diagnostics Snapshot, sensor deck).
 * - **`ghost`** — no border; quieter label + icon; good over glass toolbars.
 * - **`divider`** — like ghost but with a bottom divider line between rows.
 */
export type TRNParameterAppearance = "card" | "ghost" | "divider";

const APPEARANCE_ROW_CLASS: Record<TRNParameterAppearance, string> = {
  card:
    "rounded border border-zinc-700/80 px-2 py-1 text-xs font-normal leading-none ",
  ghost:
    "rounded-none border-0 bg-transparent px-0 py-1 text-[11px] font-normal leading-snug ",
  divider:
    "rounded-none border-0 border-b border-zinc-800/75 bg-transparent px-0 py-1.5 text-[11px] font-normal leading-snug ",
};

const APPEARANCE_VALUE_CLASS: Record<TRNParameterAppearance, string> = {
  card: "text-zinc-100",
  ghost: "text-zinc-50",
  divider: "text-zinc-50",
};

const APPEARANCE_UNIT_CLASS: Record<TRNParameterAppearance, string> = {
  card: "text-zinc-300",
  ghost: "text-zinc-500",
  divider: "text-zinc-400",
};

const APPEARANCE_ICON_CLASS: Record<TRNParameterAppearance, string> = {
  card: "text-zinc-400",
  ghost: "text-zinc-500",
  divider: "text-zinc-500",
};

/** Muted label when `name` is plain text; explicit colors on child nodes still win. */
const APPEARANCE_LABEL_WRAP_CLASS: Record<TRNParameterAppearance, string> = {
  card: "",
  ghost: "text-zinc-400",
  divider: "text-zinc-400",
};

type TRNParameterProps = {
  name: ReactNode;
  value: ReactNode;
  gauge?: ReactNode;
  unit?: ReactNode;
  icon?: ReactNode;
  className?: string;
  /** Row chrome and default label / value / unit / icon tones. Default **`card`**. */
  appearance?: TRNParameterAppearance;
  /** Default `fixed` (60px). Use `auto` for long labels (e.g. telemetry meta rows). */
  nameColumnLayout?: TRNParameterNameColumnLayout;
  /**
   * `full` (default) = row stretches to the container width (`w-full`).
   * `hug` = row width follows label + value (`w-fit max-w-full`), e.g. telemetry sidebar counters.
   */
  rowSpan?: "full" | "hug";
  /** Default `fixed` (100px block). Use `auto` so value/unit expand in the row (e.g. 2-column grids). */
  valueColumnLayout?: TRNParameterValueColumnLayout;
  /** When false, value text is never ellipsized (e.g. long telemetry meta counter · Hz). Default true. */
  valueTruncate?: boolean;
  /**
   * Fixed width for the unit column when `unit` is set (including empty string), so values line up across rows.
   * Default `w-4`; override (e.g. `w-9`) if a longer unit string needs space.
   */
  unitColumnClassName?: string;
  /**
   * When set with `valueColumnLayout="auto"`, the numeric value uses this width (`ch` works well with `tabular-nums`)
   * and the value+unit block becomes `shrink-0` so the gauge is the only `flex-1` — stable bar width and aligned numbers.
   */
  valueTextColumnClassName?: string;
  /** Rich hover/focus hint (uses `TRNTooltip`). Omit for rows without extra explanation. */
  hint?: ReactNode;
  /** Tailwind classes merged into the tooltip panel (e.g. wider max-width for long copy). */
  hintPanelClassName?: string;
  /** Override icon wrapper classes (default: muted zinc). Use with iconSlotStyle for gauge-matched tint. */
  iconSlotClassName?: string;
  /** Override icon wrapper inline style (e.g. { color: fillHex }). */
  iconSlotStyle?: CSSProperties;
  /**
   * Whether positive numeric values show a leading `+`.
   * Default `always` preserves legacy behavior; use `omit` for counts, heaps, or %-of-range that are never negative.
   */
  positiveSignMode?: TRNParameterPositiveSignMode;
  /**
   * When set with `icon`, runs a short GSAP scale pulse on the icon when the displayed value changes.
   * Throttled (see `iconPulseThrottleMs`). Respects `prefers-reduced-motion`.
   */
  iconPulseOnValueChange?: boolean;
  /** Default 280 ms. */
  iconPulseThrottleMs?: number;
  /** Motion strength preset for the icon pulse. Default **`normal`**. */
  iconPulseIntensityPreset?: TrnIconPulseIntensityPreset;
  /** Peak stroke tint (`#rrggbb`) at the pulse apex. Default matches telemetry settings default green. */
  iconPulsePeakColorHex?: string;
  /** GSAP ease family for the pulse (smooth / elastic / back / snappy). Default **`smooth`**. */
  iconPulseAnimationPreset?: SensorTelemetryIconPulseAnimationPreset;
  /** When false, pulse motion only (no peak color tween). Default **`true`**. */
  iconPulseColorAnimationEnabled?: boolean;
  /**
   * When `iconPulseOnValueChange` is on, use this for change detection instead of the formatted `value`
   * (e.g. parent sample string) so the icon does not re-pulse on every frame of an in-row value tween.
   */
  iconPulseTriggerKey?: ReactNode;
};

export const TRNParameter = ({
  name,
  value,
  gauge,
  unit,
  icon,
  className = "",
  appearance = "card",
  nameColumnLayout = "fixed",
  rowSpan = "full",
  hint,
  hintPanelClassName = "",
  iconSlotClassName,
  iconSlotStyle,
  valueColumnLayout = "fixed",
  valueTruncate = true,
  unitColumnClassName = "w-4",
  valueTextColumnClassName,
  positiveSignMode = "always",
  iconPulseOnValueChange = false,
  iconPulseThrottleMs = DEFAULT_ICON_PULSE_THROTTLE_MS,
  iconPulseIntensityPreset = "normal",
  iconPulsePeakColorHex = DEFAULT_TRN_ICON_PULSE_PEAK_COLOR_HEX,
  iconPulseAnimationPreset = "smooth",
  iconPulseColorAnimationEnabled = true,
  iconPulseTriggerKey,
}: TRNParameterProps) => {
  const iconWrapRef = useRef<HTMLDivElement | null>(null);

  const iconPulseStyle = useMemo(
    (): TRNParameterIconPulseStyle => ({
      throttleMs: iconPulseThrottleMs,
      intensityPreset: iconPulseIntensityPreset,
      peakColorHex: iconPulsePeakColorHex,
      animationPreset: iconPulseAnimationPreset,
      colorAnimationEnabled: iconPulseColorAnimationEnabled,
    }),
    [
      iconPulseAnimationPreset,
      iconPulseColorAnimationEnabled,
      iconPulsePeakColorHex,
      iconPulseIntensityPreset,
      iconPulseThrottleMs,
    ],
  );

  const nameColumnClassName =
    nameColumnLayout === "auto"
      ? rowSpan === "hug"
        ? "flex w-fit shrink-0 flex-row items-center gap-2"
        : "flex w-fit max-w-[50%] shrink-0 flex-row items-center gap-2"
      : "flex w-[60px] shrink-0 flex-row items-center gap-2";

  const displayValue = useMemo(() => {
    const wantPlus = positiveSignMode === "always";
    if (typeof value === "number") {
      if (wantPlus) {
        return value > 0 ? `+${value}` : `${value}`;
      }
      return `${value}`;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      const numeric = Number(trimmed);
      if (
        wantPlus &&
        trimmed.length > 0 &&
        Number.isFinite(numeric) &&
        numeric > 0 &&
        !trimmed.startsWith("+")
      ) {
        return `+${trimmed}`;
      }
    }
    return value;
  }, [positiveSignMode, value]);

  const iconPulseKeySource =
    iconPulseTriggerKey !== undefined ? iconPulseTriggerKey : displayValue;

  const iconRestColor = useMemo((): string | undefined => {
    if (iconSlotStyle == null || typeof iconSlotStyle !== "object") {
      return undefined;
    }
    const c = (iconSlotStyle as CSSProperties).color;
    return typeof c === "string" && c.length > 0 ? c : undefined;
  }, [iconSlotStyle]);

  useGsapIconPulseOnValueChange(
    iconWrapRef,
    iconPulseOnValueChange,
    icon,
    iconPulseKeySource,
    iconRestColor,
    iconPulseStyle,
  );

  const valueSlotTight =
    valueColumnLayout === "auto" &&
    valueTextColumnClassName != null &&
    valueTextColumnClassName.trim() !== "";

  const rowWidthClass = rowSpan === "hug" ? "w-fit max-w-full " : "w-full ";
  const rowLayoutClass =
    valueSlotTight && gauge != null
      ? `flex ${rowWidthClass}min-w-0 flex-row items-center gap-2 `
      : `flex ${rowWidthClass}flex-row items-center gap-2 justify-between `;

  const valueBlockClassName =
    valueColumnLayout === "auto"
      ? valueSlotTight
        ? "flex shrink-0 flex-row items-center gap-2"
        : valueTruncate
          ? "flex min-w-0 flex-1 flex-row items-center gap-2"
          : "flex shrink-0 flex-row items-center gap-2"
      : valueTruncate
        ? "flex w-[100px] shrink-0 flex-row items-center gap-2"
        : "flex w-fit max-w-none shrink-0 flex-row items-center gap-2";

  const valueToneClass = APPEARANCE_VALUE_CLASS[appearance];
  const unitToneClass = APPEARANCE_UNIT_CLASS[appearance];
  const iconToneClass = APPEARANCE_ICON_CLASS[appearance];
  const labelWrapToneClass = APPEARANCE_LABEL_WRAP_CLASS[appearance];

  const valueSpanClassName =
    (valueTruncate
      ? "min-w-0 truncate "
      : "shrink-0 ") +
    `whitespace-nowrap text-right font-semibold tabular-nums ${valueToneClass} ` +
    (valueSlotTight
      ? `${(valueTextColumnClassName ?? "").trim()} shrink-0`
      : unit != null
        ? valueTruncate
          ? "flex-1"
          : "shrink-0"
        : "w-full");

  const rowChromeClass = APPEARANCE_ROW_CLASS[appearance];

  const row = (
    <div
      className={
        rowLayoutClass +
        rowChromeClass +
        className +
        (hint != null ? " cursor-help" : "")
      }
    >
      {/* [Icon and Name] */}
      <div className={nameColumnClassName}>
        {/* Icon */}
        {icon != null ? (
          <div
            ref={iconWrapRef}
            className={
              "inline-flex h-4 w-4 origin-center items-center justify-start font-bold text-left " +
              (iconSlotClassName != null && iconSlotClassName.trim().length > 0
                ? iconSlotClassName
                : iconToneClass)
            }
            style={iconSlotStyle}
          >
            {icon}
          </div>
        ) : null}
        {/* Name */}
        {/* <span className="font-medium text-zinc-100">{name}</span> */}
        <div
          className={
            (nameColumnLayout === "auto"
              ? "min-w-0 max-w-full w-fit "
              : "") + labelWrapToneClass
          }
        >
          {name}
        </div>
      </div>

      {/* [Gauge] */}
      {gauge != null ? (
        <div className="flex min-w-0 flex-1 flex-row items-center gap-2">
          {gauge}
        </div>
      ) : null}

      {/* [Value and Unit] — fixed-width unit column; value block 100px, flex-1, or shrink-0+fixed ch */}
      <div className={valueBlockClassName}>
        <span className={valueSpanClassName}>
          {displayValue}
        </span>
        {unit != null ? (
          <span
            className={
              `inline-flex shrink-0 items-center justify-end whitespace-nowrap text-right ${unitToneClass} ` +
              unitColumnClassName
            }
          >
            {typeof unit === "string" && unit.trim() === "" ? "\u00a0" : unit}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (hint != null) {
    const tooltipWidthClass = rowSpan === "hug" ? "w-fit max-w-full min-w-0" : "w-full min-w-0";
    const triggerWidthClass = rowSpan === "hug" ? "w-fit max-w-full" : "w-full";
    return (
      <TRNTooltip
        className={tooltipWidthClass}
        triggerClassName={`!flex h-auto ${triggerWidthClass} min-w-0 cursor-help border-0 bg-transparent p-0 text-left font-[inherit] text-inherit`}
        trigger={row}
        content={
          <div className="whitespace-pre-wrap text-left leading-relaxed text-zinc-100">
            {hint}
          </div>
        }
        panelClassName={
          "!max-w-xl border-zinc-600/90 bg-zinc-950/98 px-3 py-2 text-[11px] leading-snug shadow-xl " +
          hintPanelClassName
        }
        placement="top-start"
        openDelayMs={180}
        disableHoverFx
      />
    );
  }

  return row;
};
