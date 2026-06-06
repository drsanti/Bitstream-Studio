import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Lock, RotateCcw, Unlock, Settings2, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  TRN_SCRUB_DEFAULT_ACTIVATION_THRESHOLD_PX,
  TRN_SCRUB_DEFAULT_HORIZONTAL_PX_PER_TENTH_PERCENT,
  TRN_SCRUB_DEFAULT_VERTICAL_PX_PER_PERCENT,
  TRN_SCRUB_WHEEL_PIXEL_ACCUM_THRESHOLD,
  TRNScrubNumberInput,
  type TRNScrubInteractionConfig,
} from "./TRNScrubNumberInput.js";
import { TRNMenuItemButton, TRNMenuPanel, TRNMenuSectionTitle } from "./TRNMenu.js";
import { TRNButton } from "./TRNButton.js";
import { TRNToggleSwitch } from "./TRNToggleSwitch.js";
import { TRNContextDialog } from "./TRNContextDialog.js";
import {
  loadTrnScrubNumberFieldSettings,
  saveTrnScrubNumberFieldSettings,
  type TrnScrubNumberFieldStoredSettingsV1,
} from "./trnScrubNumberFieldStorage.js";

export type TRNScrubNumberFieldIconVisibility = "hidden" | "always" | "hover";

export type TRNScrubNumberFieldAppearance = {
  variant?: "minimal" | "full";
  stepButtonsVisibility?: TRNScrubNumberFieldIconVisibility;
  lockIconVisibility?: TRNScrubNumberFieldIconVisibility;
  resetIconVisibility?: TRNScrubNumberFieldIconVisibility;
  clearIconVisibility?: TRNScrubNumberFieldIconVisibility;
};

export type TRNScrubNumberFieldWheelBoundedMode = "step" | "span-percent";

export type TRNScrubNumberFieldInteraction = TRNScrubInteractionConfig & {
  pointerScrubEnabled?: boolean;
  dragSensitivityPreset?: "slow" | "normal" | "fast" | "custom";
  wheelEnabled?: boolean;
  wheelUnboundedStep?: number;
  wheelBoundedMode?: TRNScrubNumberFieldWheelBoundedMode;
  shiftMultiplier?: number;
  ctrlOrCmdMultiplier?: number;
};

export type TRNScrubNumberFieldProps = {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  fractionDigits?: number;
  disabled?: boolean;
  locked?: boolean;
  onLockedChange?: (locked: boolean) => void;
  defaultValue?: number;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
  size?: "sm" | "md";
  appearance?: TRNScrubNumberFieldAppearance;
  interaction?: TRNScrubNumberFieldInteraction;
  /** Optional persistence key for saving settings. */
  settingsKey?: string;
  /** When set, renders a clear control inside the shell (optional bounds). */
  onClear?: () => void;
  clearAriaLabel?: string;
  /** Override built-in reset-to-`defaultValue` behavior. */
  onReset?: () => void;
  resetAriaLabel?: string;
  /** Strip outer shell chrome — parent provides border (e.g. {@link TRNBadgedScrubNumberField}). */
  embedded?: boolean;
};

const FIELD_SHELL_BASE =
  "group/trnScrubField inline-flex min-w-0 items-center gap-1 rounded border border-zinc-700/80 bg-zinc-950/45 px-1 py-1";

const ICON_BTN_BASE_MD =
  "nodrag inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-transparent p-0 text-zinc-400 outline-none transition-colors hover:bg-zinc-800/60 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-400/45 disabled:opacity-50";

const ICON_BTN_BASE_SM =
  "nodrag inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded bg-transparent p-0 text-zinc-400 outline-none transition-colors hover:bg-zinc-800/60 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-400/45 disabled:opacity-50";

function scrubIconBtnClass(size: "sm" | "md"): string {
  return size === "sm" ? ICON_BTN_BASE_SM : ICON_BTN_BASE_MD;
}

/** Lock toggle — unlocked = editable (green tint), locked = blocked (red tint). */
const LOCK_BTN_UNLOCKED_TONE =
  "bg-emerald-500/15 text-emerald-300/95 hover:bg-emerald-500/25 hover:text-emerald-100";
const LOCK_BTN_LOCKED_TONE =
  "bg-red-500/15 text-red-300/95 hover:bg-red-500/25 hover:text-red-100";

const STEP_BTN_TONE =
  "border border-zinc-700/70 bg-zinc-900/55 hover:border-zinc-600/80 hover:bg-zinc-800/70";

const MENU_Z_INDEX = 2200;

const INLINE_CHOICE_WRAP =
  "inline-flex items-center gap-1";
const INLINE_CHOICE_BTN =
  // Match TRNButton compact typography/chrome (e.g. “Restore view”).
  "inline-flex h-6 min-w-10 items-center justify-center rounded-sm border px-2 text-xs font-medium " +
  "text-zinc-100 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/50 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const DRAG_SENSITIVITY_PRESETS: Record<
  NonNullable<TrnScrubNumberFieldStoredSettingsV1["interaction"]>["dragSensitivityPreset"],
  { h: number; v: number; thr: number }
> = {
  slow: { h: 140, v: 70, thr: 4 },
  normal: {
    h: TRN_SCRUB_DEFAULT_HORIZONTAL_PX_PER_TENTH_PERCENT,
    v: TRN_SCRUB_DEFAULT_VERTICAL_PX_PER_PERCENT,
    thr: TRN_SCRUB_DEFAULT_ACTIVATION_THRESHOLD_PX,
  },
  fast: { h: 60, v: 30, thr: 4 },
  custom: {
    h: TRN_SCRUB_DEFAULT_HORIZONTAL_PX_PER_TENTH_PERCENT,
    v: TRN_SCRUB_DEFAULT_VERTICAL_PX_PER_PERCENT,
    thr: TRN_SCRUB_DEFAULT_ACTIVATION_THRESHOLD_PX,
  },
};

function scrubFieldIconHoverClass(visibility: TRNScrubNumberFieldIconVisibility): string {
  return visibility === "hover"
    ? "opacity-0 group-hover/trnScrubField:opacity-100 group-focus-within/trnScrubField:opacity-100"
    : "";
}

function scrubValuesEqual(a: number, b: number, fractionDigits?: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return false;
  }
  if (fractionDigits != null && fractionDigits >= 0) {
    const quantum = Math.pow(10, -fractionDigits) / 2;
    return Math.abs(a - b) <= quantum;
  }
  return a === b;
}

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

export function TRNScrubNumberField(props: TRNScrubNumberFieldProps) {
  const {
    value,
    onChange,
    step,
    min,
    max,
    fractionDigits,
    disabled = false,
    locked: lockedProp,
    onLockedChange,
    defaultValue,
    ariaLabel,
    className,
    inputClassName,
    size = "md",
    appearance,
    interaction,
    settingsKey,
    onClear,
    clearAriaLabel,
    onReset,
    resetAriaLabel,
    embedded = false,
  } = props;

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<{ x: number; y: number } | null>(null);

  const [localLocked, setLocalLocked] = useState(false);
  const locked = lockedProp ?? localLocked;

  const stored = useMemo(
    () => (settingsKey ? loadTrnScrubNumberFieldSettings(settingsKey) : null),
    [settingsKey],
  );

  const initialSettings = useMemo<TrnScrubNumberFieldStoredSettingsV1>(
    () => ({
      version: 1,
      valueRules: {
        min: stored?.valueRules?.min,
        max: stored?.valueRules?.max,
        step: stored?.valueRules?.step,
        stepAuto: stored?.valueRules?.stepAuto ?? true,
      },
      appearance: {
        variant: appearance?.variant ?? stored?.appearance?.variant ?? "minimal",
        stepButtonsVisibility:
          appearance?.stepButtonsVisibility ??
          stored?.appearance?.stepButtonsVisibility ??
          // Back-compat with older booleans.
          ((stored as any)?.appearance?.showStepButtons === false ? "hidden" : "hover"),
        lockIconVisibility:
          appearance?.lockIconVisibility ??
          stored?.appearance?.lockIconVisibility ??
          ((stored as any)?.appearance?.showLockToggle === false ? "hidden" : "hover"),
        resetIconVisibility:
          appearance?.resetIconVisibility ??
          stored?.appearance?.resetIconVisibility ??
          "hover",
        clearIconVisibility:
          appearance?.clearIconVisibility ??
          stored?.appearance?.clearIconVisibility ??
          "hover",
      },
      interaction: {
        pointerScrubEnabled:
          stored?.interaction?.pointerScrubEnabled ??
          interaction?.pointerScrubEnabled ??
          true,
        dragSensitivityPreset: stored?.interaction?.dragSensitivityPreset ?? "normal",
        wheelEnabled:
          stored?.interaction?.wheelEnabled ?? interaction?.wheelEnabled ?? true,
        wheelUnboundedStep:
          stored?.interaction?.wheelUnboundedStep ??
          interaction?.wheelUnboundedStep ??
          1,
        wheelBoundedMode:
          stored?.interaction?.wheelBoundedMode ??
          interaction?.wheelBoundedMode ??
          "span-percent",
        shiftMultiplier:
          stored?.interaction?.shiftMultiplier ??
          interaction?.shiftMultiplier ??
          0.1,
        ctrlOrCmdMultiplier:
          stored?.interaction?.ctrlOrCmdMultiplier ??
          interaction?.ctrlOrCmdMultiplier ??
          10,
        horizontalPxPerTenthPercent:
          stored?.interaction?.horizontalPxPerTenthPercent ??
          interaction?.horizontalPxPerTenthPercent ??
          TRN_SCRUB_DEFAULT_HORIZONTAL_PX_PER_TENTH_PERCENT,
        verticalPxPerPercent:
          stored?.interaction?.verticalPxPerPercent ??
          interaction?.verticalPxPerPercent ??
          TRN_SCRUB_DEFAULT_VERTICAL_PX_PER_PERCENT,
        scrubActivationThresholdPx:
          stored?.interaction?.scrubActivationThresholdPx ??
          TRN_SCRUB_DEFAULT_ACTIVATION_THRESHOLD_PX,
        wheelPixelAccumThreshold:
          stored?.interaction?.wheelPixelAccumThreshold ??
          interaction?.wheelPixelAccumThreshold ??
          TRN_SCRUB_WHEEL_PIXEL_ACCUM_THRESHOLD,
      },
    }),
    [appearance, interaction, stored],
  );

  const [settings, setSettings] = useState<TrnScrubNumberFieldStoredSettingsV1>(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const mergedAppearance: Required<TRNScrubNumberFieldAppearance> = {
    variant: settings.appearance?.variant ?? "minimal",
    stepButtonsVisibility: settings.appearance?.stepButtonsVisibility ?? "hover",
    lockIconVisibility: settings.appearance?.lockIconVisibility ?? "hover",
    resetIconVisibility: settings.appearance?.resetIconVisibility ?? "hover",
    clearIconVisibility: settings.appearance?.clearIconVisibility ?? "hover",
  };

  const mergedInteraction: Required<TRNScrubNumberFieldInteraction> = {
    pointerScrubEnabled: settings.interaction?.pointerScrubEnabled ?? true,
    wheelEnabled: settings.interaction?.wheelEnabled ?? true,
    wheelUnboundedStep: settings.interaction?.wheelUnboundedStep ?? 1,
    wheelBoundedMode: settings.interaction?.wheelBoundedMode ?? "span-percent",
    shiftMultiplier: settings.interaction?.shiftMultiplier ?? 0.1,
    ctrlOrCmdMultiplier: settings.interaction?.ctrlOrCmdMultiplier ?? 10,
    horizontalPxPerTenthPercent:
      settings.interaction?.horizontalPxPerTenthPercent ??
      TRN_SCRUB_DEFAULT_HORIZONTAL_PX_PER_TENTH_PERCENT,
    verticalPxPerPercent:
      settings.interaction?.verticalPxPerPercent ??
      TRN_SCRUB_DEFAULT_VERTICAL_PX_PER_PERCENT,
    scrubActivationThresholdPx:
      settings.interaction?.scrubActivationThresholdPx ??
      TRN_SCRUB_DEFAULT_ACTIVATION_THRESHOLD_PX,
    wheelPixelAccumThreshold:
      settings.interaction?.wheelPixelAccumThreshold ??
      TRN_SCRUB_WHEEL_PIXEL_ACCUM_THRESHOLD,
    dragSensitivityPreset: settings.interaction?.dragSensitivityPreset ?? "normal",
  };

  const dragPreset = mergedInteraction.dragSensitivityPreset;
  const effectiveDragH =
    dragPreset === "custom"
      ? mergedInteraction.horizontalPxPerTenthPercent
      : DRAG_SENSITIVITY_PRESETS[dragPreset].h;
  const effectiveDragV =
    dragPreset === "custom"
      ? mergedInteraction.verticalPxPerPercent
      : DRAG_SENSITIVITY_PRESETS[dragPreset].v;
  const effectiveDragThr =
    dragPreset === "custom"
      ? mergedInteraction.scrubActivationThresholdPx
      : DRAG_SENSITIVITY_PRESETS[dragPreset].thr;

  const effectiveMin =
    typeof min === "number"
      ? min
      : settings.valueRules?.min;
  const effectiveMax =
    typeof max === "number"
      ? max
      : settings.valueRules?.max;
  const effectiveStepProp =
    typeof step === "number"
      ? step
      : settings.valueRules?.stepAuto === false
        ? settings.valueRules?.step
        : undefined;

  const iconSizeClass = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  const iconBtnClass = scrubIconBtnClass(size);
  const shellClass =
    size === "sm"
      ? "px-1 py-[3px]"
      : "px-1 py-1";

  const stepButtonsVisibleClass = scrubFieldIconHoverClass(mergedAppearance.stepButtonsVisibility);
  const lockVisibleClass = scrubFieldIconHoverClass(mergedAppearance.lockIconVisibility);
  const resetVisibleClass = scrubFieldIconHoverClass(mergedAppearance.resetIconVisibility);
  const clearVisibleClass = scrubFieldIconHoverClass(mergedAppearance.clearIconVisibility);

  useEffect(() => {
    if (menuAnchor == null) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuAnchor(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuAnchor(null);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuAnchor]);

  const setLocked = (next: boolean) => {
    if (onLockedChange) {
      onLockedChange(next);
    } else {
      setLocalLocked(next);
    }
  };

  const effectiveStep = useMemo(() => {
    if (typeof effectiveStepProp === "number" && Number.isFinite(effectiveStepProp) && effectiveStepProp > 0) {
      return effectiveStepProp;
    }
    const span = finiteSpan(effectiveMin, effectiveMax);
    if (span != null) {
      return Math.max(1e-6, span / 256);
    }
    return 1;
  }, [effectiveMax, effectiveMin, effectiveStepProp]);

  const stepMultiplierForEvent = (e: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }) => {
    let mult = 1;
    if (e.shiftKey) mult *= mergedInteraction.shiftMultiplier;
    if (e.ctrlKey || e.metaKey) mult *= mergedInteraction.ctrlOrCmdMultiplier;
    return mult;
  };

  const onWheelCapture = (e: React.WheelEvent) => {
    if (!mergedInteraction.wheelEnabled || disabled || locked) return;
    // Let TRNScrubNumberInput handle its own wheel if desired. We intercept only to
    // support bounded-mode selection.
    const span = finiteSpan(effectiveMin, effectiveMax);
    if (span != null && mergedInteraction.wheelBoundedMode === "step") {
      e.preventDefault();
      e.stopPropagation();
      const dir = Math.sign(-e.deltaY);
      if (dir === 0) return;
      const mult = stepMultiplierForEvent(e);
      onChange(Number.isFinite(value) ? value + effectiveStep * dir * mult : 0);
    }
  };

  const showFull = mergedAppearance.variant === "full";
  const showStepButtons = showFull && mergedAppearance.stepButtonsVisibility !== "hidden";
  const showLockToggle = showFull && mergedAppearance.lockIconVisibility !== "hidden";
  const resetTarget =
    defaultValue != null && Number.isFinite(defaultValue) ? defaultValue : null;
  const canReset = onReset != null || resetTarget != null;
  const showResetIcon = canReset && mergedAppearance.resetIconVisibility !== "hidden";
  const showClearIcon =
    onClear != null && mergedAppearance.clearIconVisibility !== "hidden";
  const resetAlreadyAtDefault =
    resetTarget != null &&
    onReset == null &&
    scrubValuesEqual(value, resetTarget, fractionDigits);

  const runReset = () => {
    if (disabled || locked) {
      return;
    }
    if (onReset != null) {
      onReset();
      return;
    }
    if (resetTarget != null) {
      onChange(resetTarget);
    }
  };

  const shellProps = {
    className: twMerge(
      embedded ? "inline-flex min-w-0 flex-1 items-center gap-1" : FIELD_SHELL_BASE,
      embedded ? "" : shellClass,
      className,
    ),
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setMenuAnchor({ x: e.clientX, y: e.clientY });
    },
  };

  const stepDown = () => {
    if (disabled || locked) return;
    onChange((Number.isFinite(value) ? value : 0) - effectiveStep);
  };

  const stepUp = () => {
    if (disabled || locked) return;
    onChange((Number.isFinite(value) ? value : 0) + effectiveStep);
  };

  const menu = portalTarget && menuAnchor ? (
    createPortal(
      <div
        ref={menuRef}
        className="pointer-events-auto fixed z-2200 flex animate-in fade-in zoom-in-95 duration-100"
        style={{ top: menuAnchor.y, left: menuAnchor.x } as CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <TRNMenuPanel tone="glass-dropdown" className="w-64 p-1.5">
          <TRNMenuSectionTitle spacing="labelOnly">Scrub field</TRNMenuSectionTitle>
          <div className="mt-1 space-y-1">
            <TRNMenuItemButton
              tone="glass-dropdown"
              label={locked ? "Unlock" : "Lock"}
              icon={
                locked ? (
                  <Lock className="h-3 w-3 text-zinc-300" aria-hidden strokeWidth={2.25} />
                ) : (
                  <Unlock className="h-4 w-4 text-zinc-300" aria-hidden strokeWidth={2.25} />
                )
              }
              onClick={() => {
                setLocked(!locked);
                setMenuAnchor(null);
              }}
            />
            <TRNMenuItemButton
              tone="glass-dropdown"
              label="Reset to default"
              disabled={defaultValue == null || disabled || locked}
              onClick={() => {
                if (defaultValue == null) return;
                onChange(defaultValue);
                setMenuAnchor(null);
              }}
            />
            <TRNMenuItemButton
              tone="glass-dropdown"
              label="Settings…"
              icon={<Settings2 className="h-4 w-4 text-zinc-300" aria-hidden strokeWidth={2.25} />}
              onClick={() => {
                setMenuAnchor(null);
                requestAnimationFrame(() => {
                  setSettingsAnchor(menuAnchor);
                  setSettingsOpen(true);
                });
              }}
            />
          </div>
        </TRNMenuPanel>
      </div>,
      portalTarget,
    )
  ) : null;

  const settingsDialog = (
    <TRNContextDialog
      open={settingsOpen}
      onOpenChange={(open) => {
        setSettingsOpen(open);
        if (!open) {
          setSettingsAnchor(null);
        }
      }}
      title="Scrub settings"
      anchor={settingsAnchor}
      widthPx={460}
      zIndex={MENU_Z_INDEX + 6}
    >
      <div className="space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Appearance
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-300">Variant</div>
          <div className={INLINE_CHOICE_WRAP} role="radiogroup" aria-label="Variant">
            {(["minimal", "full"] as const).map((v) => {
              const active = mergedAppearance.variant === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={twMerge(
                    INLINE_CHOICE_BTN,
                    active
                      ? "border-cyan-500/45 bg-cyan-500/18 text-cyan-100"
                      : "border-zinc-700/80 bg-zinc-900/75 text-zinc-100 hover:bg-zinc-800/75",
                  )}
                  onClick={() => {
                    const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                      ...settings,
                      appearance: { ...settings.appearance, variant: v },
                    };
                    setSettings(updated);
                    if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
                  }}
                >
                  {v === "minimal" ? "Minimal" : "Full"}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-300">Show [‹][›]</div>
          <div className={INLINE_CHOICE_WRAP} role="radiogroup" aria-label="Step buttons visibility">
            {([
              { id: "hidden", label: "Hidden" },
              { id: "always", label: "Always" },
              { id: "hover", label: "On hover" },
            ] as const).map((o) => {
              const active = mergedAppearance.stepButtonsVisibility === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={twMerge(
                    INLINE_CHOICE_BTN,
                    active
                      ? "border-cyan-500/45 bg-cyan-500/18 text-cyan-100"
                      : "border-zinc-700/80 bg-zinc-900/75 text-zinc-100 hover:bg-zinc-800/75",
                  )}
                  onClick={() => {
                    const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                      ...settings,
                      appearance: { ...settings.appearance, stepButtonsVisibility: o.id },
                    };
                    setSettings(updated);
                    if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-300">Show lock</div>
          <div className={INLINE_CHOICE_WRAP} role="radiogroup" aria-label="Lock icon visibility">
            {([
              { id: "hidden", label: "Hidden" },
              { id: "always", label: "Always" },
              { id: "hover", label: "On hover" },
            ] as const).map((o) => {
              const active = mergedAppearance.lockIconVisibility === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={twMerge(
                    INLINE_CHOICE_BTN,
                    active
                      ? "border-cyan-500/45 bg-cyan-500/18 text-cyan-100"
                      : "border-zinc-700/80 bg-zinc-900/75 text-zinc-100 hover:bg-zinc-800/75",
                  )}
                  onClick={() => {
                    const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                      ...settings,
                      appearance: { ...settings.appearance, lockIconVisibility: o.id },
                    };
                    setSettings(updated);
                    if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-300">Show reset</div>
          <div className={INLINE_CHOICE_WRAP} role="radiogroup" aria-label="Reset icon visibility">
            {([
              { id: "hidden", label: "Hidden" },
              { id: "always", label: "Always" },
              { id: "hover", label: "On hover" },
            ] as const).map((o) => {
              const active = mergedAppearance.resetIconVisibility === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={twMerge(
                    INLINE_CHOICE_BTN,
                    active
                      ? "border-cyan-500/45 bg-cyan-500/18 text-cyan-100"
                      : "border-zinc-700/80 bg-zinc-900/75 text-zinc-100 hover:bg-zinc-800/75",
                  )}
                  onClick={() => {
                    const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                      ...settings,
                      appearance: { ...settings.appearance, resetIconVisibility: o.id },
                    };
                    setSettings(updated);
                    if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-300">Show clear</div>
          <div className={INLINE_CHOICE_WRAP} role="radiogroup" aria-label="Clear icon visibility">
            {([
              { id: "hidden", label: "Hidden" },
              { id: "always", label: "Always" },
              { id: "hover", label: "On hover" },
            ] as const).map((o) => {
              const active = mergedAppearance.clearIconVisibility === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={twMerge(
                    INLINE_CHOICE_BTN,
                    active
                      ? "border-cyan-500/45 bg-cyan-500/18 text-cyan-100"
                      : "border-zinc-700/80 bg-zinc-900/75 text-zinc-100 hover:bg-zinc-800/75",
                  )}
                  onClick={() => {
                    const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                      ...settings,
                      appearance: { ...settings.appearance, clearIconVisibility: o.id },
                    };
                    setSettings(updated);
                    if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Value rules
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-300">Min</div>
          <TRNScrubNumberInput
            aria-label="Default min"
            value={settings.valueRules?.min ?? 0}
            onChange={(n) => {
              const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                ...settings,
                valueRules: { ...settings.valueRules, min: n },
              };
              setSettings(updated);
              if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
            }}
            locked={settings.valueRules?.min == null}
            pointerScrubEnabled={false}
            inputClassName="text-[11px] font-sans proportional-nums"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-300">Max</div>
          <TRNScrubNumberInput
            aria-label="Default max"
            value={settings.valueRules?.max ?? 0}
            onChange={(n) => {
              const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                ...settings,
                valueRules: { ...settings.valueRules, max: n },
              };
              setSettings(updated);
              if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
            }}
            locked={settings.valueRules?.max == null}
            pointerScrubEnabled={false}
            inputClassName="text-[11px] font-sans proportional-nums"
          />
        </div>

        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Interaction
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-300">Pointer drag scrub</div>
          <TRNToggleSwitch
            checked={mergedInteraction.pointerScrubEnabled}
            ariaLabel="Enable pointer drag scrub"
            onCheckedChange={(next) => {
              const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                ...settings,
                interaction: { ...settings.interaction, pointerScrubEnabled: next },
              };
              setSettings(updated);
              if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-300">Drag sensitivity</div>
          <div className={INLINE_CHOICE_WRAP} role="radiogroup" aria-label="Drag sensitivity">
            {([
              { id: "slow", label: "Slow" },
              { id: "normal", label: "Normal" },
              { id: "fast", label: "Fast" },
              { id: "custom", label: "Custom" },
            ] as const).map((o) => {
              const active = dragPreset === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={twMerge(
                    INLINE_CHOICE_BTN,
                    active
                      ? "border-cyan-500/45 bg-cyan-500/18 text-cyan-100"
                      : "border-zinc-700/80 bg-zinc-900/75 text-zinc-100 hover:bg-zinc-800/75",
                  )}
                  onClick={() => {
                    const preset = o.id;
                    const base = DRAG_SENSITIVITY_PRESETS[preset as keyof typeof DRAG_SENSITIVITY_PRESETS];
                    const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                      ...settings,
                      interaction: {
                        ...settings.interaction,
                        dragSensitivityPreset: preset,
                        horizontalPxPerTenthPercent:
                          preset === "custom"
                            ? settings.interaction?.horizontalPxPerTenthPercent
                            : base.h,
                        verticalPxPerPercent:
                          preset === "custom"
                            ? settings.interaction?.verticalPxPerPercent
                            : base.v,
                        scrubActivationThresholdPx:
                          preset === "custom"
                            ? settings.interaction?.scrubActivationThresholdPx
                            : base.thr,
                      },
                    };
                    setSettings(updated);
                    if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        {dragPreset === "custom" ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] text-zinc-300">Horizontal speed</div>
              <TRNScrubNumberInput
                aria-label="Horizontal px per 0.1%"
                value={mergedInteraction.horizontalPxPerTenthPercent}
                onChange={(n) => {
                  const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                    ...settings,
                    interaction: { ...settings.interaction, horizontalPxPerTenthPercent: Math.max(1, n) },
                  };
                  setSettings(updated);
                  if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
                }}
                pointerScrubEnabled={false}
                inputClassName="text-[11px] font-sans proportional-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] text-zinc-300">Vertical speed</div>
              <TRNScrubNumberInput
                aria-label="Vertical px per 1%"
                value={mergedInteraction.verticalPxPerPercent}
                onChange={(n) => {
                  const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                    ...settings,
                    interaction: { ...settings.interaction, verticalPxPerPercent: Math.max(1, n) },
                  };
                  setSettings(updated);
                  if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
                }}
                pointerScrubEnabled={false}
                inputClassName="text-[11px] font-sans proportional-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] text-zinc-300">Activation threshold</div>
              <TRNScrubNumberInput
                aria-label="Activation threshold px"
                value={mergedInteraction.scrubActivationThresholdPx}
                onChange={(n) => {
                  const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                    ...settings,
                    interaction: { ...settings.interaction, scrubActivationThresholdPx: Math.max(0, n) },
                  };
                  setSettings(updated);
                  if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
                }}
                pointerScrubEnabled={false}
                inputClassName="text-[11px] font-sans proportional-nums"
              />
            </div>
            <div className="text-[10px] leading-snug text-zinc-500">
              Lower px = faster. Threshold controls how far you move before scrubbing starts.
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-300">Enable wheel</div>
          <TRNToggleSwitch
            checked={mergedInteraction.wheelEnabled}
            ariaLabel="Enable mouse wheel"
            onCheckedChange={(next) => {
              const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                ...settings,
                interaction: { ...settings.interaction, wheelEnabled: next },
              };
              setSettings(updated);
              if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-300">Bounded wheel</div>
          <div className={INLINE_CHOICE_WRAP} role="radiogroup" aria-label="Bounded wheel">
            {([
              { id: "span-percent", label: "1% span" },
              { id: "step", label: "Step" },
            ] as const).map((o) => {
              const active = mergedInteraction.wheelBoundedMode === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={twMerge(
                    INLINE_CHOICE_BTN,
                    active
                      ? "border-cyan-500/45 bg-cyan-500/18 text-cyan-100"
                      : "border-zinc-700/80 bg-zinc-900/75 text-zinc-100 hover:bg-zinc-800/75",
                  )}
                  onClick={() => {
                    const updated: TrnScrubNumberFieldStoredSettingsV1 = {
                      ...settings,
                      interaction: { ...settings.interaction, wheelBoundedMode: o.id },
                    };
                    setSettings(updated);
                    if (settingsKey) saveTrnScrubNumberFieldSettings(settingsKey, updated);
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </TRNContextDialog>
  );

  return (
    <>
      <div {...shellProps} onWheelCapture={onWheelCapture}>
        {showStepButtons ? (
          <button
            type="button"
            className={twMerge(
              iconBtnClass,
              STEP_BTN_TONE,
              mergedAppearance.stepButtonsVisibility === "always" ? "" : stepButtonsVisibleClass,
            )}
            aria-label="Step down"
            disabled={disabled || locked}
            onClick={(e) => {
              e.preventDefault();
              stepDown();
            }}
          >
            <ChevronLeft className={iconSizeClass} aria-hidden strokeWidth={2.25} />
          </button>
        ) : null}

        <TRNScrubNumberInput
          value={value}
          onChange={onChange}
          step={effectiveStepProp}
          min={effectiveMin}
          max={effectiveMax}
          fractionDigits={fractionDigits}
          disabled={disabled}
          locked={locked}
          pointerScrubEnabled={mergedInteraction.pointerScrubEnabled}
          horizontalPxPerTenthPercent={effectiveDragH}
          verticalPxPerPercent={effectiveDragV}
          scrubActivationThresholdPx={effectiveDragThr}
          wheelPixelAccumThreshold={mergedInteraction.wheelPixelAccumThreshold}
          className="min-w-0 flex-1"
          inputClassName={twMerge(
            inputClassName,
            size === "sm" ? "text-[10px]" : "text-[11px]",
            // Default TRN style: no mono/tabular, center the value.
            "font-sans proportional-nums text-center",
          )}
          aria-label={ariaLabel}
        />

        {showStepButtons ? (
          <button
            type="button"
            className={twMerge(
              iconBtnClass,
              STEP_BTN_TONE,
              mergedAppearance.stepButtonsVisibility === "always" ? "" : stepButtonsVisibleClass,
            )}
            aria-label="Step up"
            disabled={disabled || locked}
            onClick={(e) => {
              e.preventDefault();
              stepUp();
            }}
          >
            <ChevronRight className={iconSizeClass} aria-hidden strokeWidth={2.25} />
          </button>
        ) : null}

        {showLockToggle ? (
          <button
            type="button"
            className={twMerge(
              iconBtnClass,
              locked ? LOCK_BTN_LOCKED_TONE : LOCK_BTN_UNLOCKED_TONE,
              mergedAppearance.lockIconVisibility === "always" ? "" : lockVisibleClass,
            )}
            aria-label={locked ? "Unlock value" : "Lock value"}
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              setLocked(!locked);
            }}
          >
            {locked ? (
              <Lock className={iconSizeClass} aria-hidden strokeWidth={2.25} />
            ) : (
              <Unlock className={iconSizeClass} aria-hidden strokeWidth={2.25} />
            )}
          </button>
        ) : null}

        {showResetIcon ? (
          <button
            type="button"
            className={twMerge(
              iconBtnClass,
              mergedAppearance.resetIconVisibility === "always" ? "" : resetVisibleClass,
            )}
            aria-label={resetAriaLabel ?? "Reset to default value"}
            disabled={disabled || locked || resetAlreadyAtDefault}
            onClick={(e) => {
              e.preventDefault();
              runReset();
            }}
          >
            <RotateCcw className={iconSizeClass} aria-hidden strokeWidth={2.25} />
          </button>
        ) : null}

        {showClearIcon ? (
          <button
            type="button"
            className={twMerge(
              iconBtnClass,
              mergedAppearance.clearIconVisibility === "always" ? "" : clearVisibleClass,
            )}
            aria-label={clearAriaLabel ?? "Clear value"}
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              onClear?.();
            }}
          >
            <X className={iconSizeClass} aria-hidden strokeWidth={2.25} />
          </button>
        ) : null}
      </div>
      {menu}
      {settingsDialog}
    </>
  );
}

