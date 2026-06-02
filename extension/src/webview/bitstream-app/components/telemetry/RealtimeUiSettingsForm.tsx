import {
  TRNParameter,
  TRNButton,
  TRNParameterSlider,
  TRNPresetGroup,
  TRNColorRingPicker,
  TRNSelect,
  TRNToggleSwitch,
  TRNTooltip,
} from "@/ui/TRN";
import {
  SENSOR_TELEMETRY_ICON_PULSE_ANIMATION_PRESETS,
  SENSOR_TELEMETRY_ICON_PULSE_INTENSITY_PRESETS,
  SENSOR_TELEMETRY_TWEEN_EASES,
  normalizeSensorTelemetryIconPulseAnimationPreset,
  normalizeSensorTelemetryIconPulseIntensityPreset,
  normalizeSensorTelemetryIconPulsePeakColorHex,
  normalizeSensorTelemetryTweenEase,
} from "../../config/sensorTelemetryUiConfig.js";
import { useBitstreamConfig } from "../../hooks/useBitstreamConfig.js";
import { Activity, Box, Cpu, FileText, Gauge, RotateCcw, Sparkles, Timer } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";

const SETTINGS_SECTION_TITLE_CLASS = "text-xs font-semibold normal-case tracking-normal text-zinc-100";
const SETTINGS_FIELD_LABEL_CLASS = "text-xs font-medium text-zinc-200";
const SETTINGS_GROUP_LABEL_CLASS = "mb-1 block text-xs font-semibold normal-case tracking-normal text-zinc-100";
const SETTINGS_TOGGLE_ROW_CLASS =
  "mb-2 flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1 text-sm";
const HUE_BAR_GRADIENT =
  "linear-gradient(90deg, #ff0033 0%, #ff8a00 16%, #ffe600 33%, #21d07a 50%, #22d3ee 66%, #3b82f6 82%, #d946ef 100%)";

function wrapHueDegrees(value: number): number {
  const n = value % 360;
  return n < 0 ? n + 360 : n;
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = wrapHueDegrees(h) / 360;
  const sat = Math.max(0, Math.min(1, s / 100));
  const light = Math.max(0, Math.min(1, l / 100));
  if (sat <= 0) {
    const gray = Math.round(light * 255);
    const g = gray.toString(16).padStart(2, "0");
    return `#${g}${g}${g}`;
  }
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const hue2rgb = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const r = Math.round(hue2rgb(hue + 1 / 3) * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(hue2rgb(hue) * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(hue2rgb(hue - 1 / 3) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`;
}

function hexToHueDegrees(hexColor: string): number {
  const hex = hexColor.replace("#", "").trim();
  if (hex.length !== 6) {
    return 0;
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return 0;
  }
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta <= Number.EPSILON) {
    return 0;
  }
  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }
  return wrapHueDegrees(hue * 60);
}

function validateHexColor(value: string): true | string {
  const s = value.trim();
  const hex = s.startsWith("#") ? s : `#${s}`;
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return true;
  }
  return "Use hex format #rrggbb";
}

function RealtimeSettingsButtonChoiceGroup(props: {
  ariaLabel: string;
  value: string;
  disabled?: boolean;
  options: Array<{ value: string; label: ReactNode; disabled?: boolean }>;
  onValueChange: (value: string) => void;
}) {
  const { ariaLabel, value, disabled = false, options, onValueChange } = props;
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex w-full flex-row flex-wrap justify-between gap-2"
    >
      {options.map((option) => {
        const optionDisabled = disabled || option.disabled === true;
        const selected = option.value === value;
        return (
          <TRNButton
            key={option.value}
            type="button"
            size="compact"
            role="radio"
            aria-checked={selected}
            aria-pressed={selected}
            disabled={optionDisabled}
            selected={selected}
            className="min-w-14 flex-1"
            onClick={() => {
              if (!optionDisabled) {
                onValueChange(option.value);
              }
            }}
          >
            {option.label}
          </TRNButton>
        );
      })}
    </div>
  );
}

function RealtimeAnimationPreview(props: {
  sensorTelemetryValueTweenEnabled: boolean;
  sensorTelemetryValueTweenEase: string;
  sensorTelemetryInterpolationThresholdMs: number;
  sensorTelemetryInterpolationMinMs: number;
  sensorTelemetryInterpolationMaxMs: number;
  sensorTelemetryIconPulseEnabled: boolean;
  sensorTelemetryIconPulseThrottleMs: number;
  sensorTelemetryIconPulseIntensityPreset: "subtle" | "normal" | "strong";
  sensorTelemetryIconPulsePeakColorHex: string;
  sensorTelemetryIconPulseAnimationPreset: "smooth" | "elastic" | "back" | "snappy";
  sensorTelemetryIconPulseColorAnimationEnabled: boolean;
}) {
  const {
    sensorTelemetryValueTweenEnabled,
    sensorTelemetryValueTweenEase,
    sensorTelemetryInterpolationThresholdMs,
    sensorTelemetryInterpolationMinMs,
    sensorTelemetryInterpolationMaxMs,
    sensorTelemetryIconPulseEnabled,
    sensorTelemetryIconPulseThrottleMs,
    sensorTelemetryIconPulseIntensityPreset,
    sensorTelemetryIconPulsePeakColorHex,
    sensorTelemetryIconPulseAnimationPreset,
    sensorTelemetryIconPulseColorAnimationEnabled,
  } = props;
  const [previewValue, setPreviewValue] = useState(12.5);
  const [pulseKey, setPulseKey] = useState(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const motionDotRef = useRef<HTMLDivElement | null>(null);
  const autoTriggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseBurstTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const hasMountedRef = useRef(false);
  const prevMotionPresetRef = useRef(sensorTelemetryIconPulseAnimationPreset);

  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
      tweenRef.current = null;
      if (motionDotRef.current != null) {
        gsap.killTweensOf(motionDotRef.current);
      }
      if (autoTriggerTimerRef.current != null) {
        clearTimeout(autoTriggerTimerRef.current);
        autoTriggerTimerRef.current = null;
      }
      for (const timer of pulseBurstTimersRef.current) {
        clearTimeout(timer);
      }
      pulseBurstTimersRef.current = [];
    };
  }, []);

  const triggerPulseBurst = (count: number, gapMs: number) => {
    for (const timer of pulseBurstTimersRef.current) {
      clearTimeout(timer);
    }
    pulseBurstTimersRef.current = [];
    for (let i = 0; i < count; i++) {
      const timer = setTimeout(() => {
        setPulseKey((k) => k + 1);
      }, i * gapMs);
      pulseBurstTimersRef.current.push(timer);
    }
  };

  const runMotionDemo = () => {
    const dot = motionDotRef.current;
    if (dot == null) {
      return;
    }
    gsap.killTweensOf(dot);
    const ease =
      sensorTelemetryIconPulseAnimationPreset === "elastic"
        ? "elastic.out(1,0.35)"
        : sensorTelemetryIconPulseAnimationPreset === "back"
          ? "back.out(1.4)"
          : sensorTelemetryIconPulseAnimationPreset === "snappy"
            ? "power3.out"
            : "power2.inOut";
    gsap.fromTo(
      dot,
      {
        x: 0,
        scale: 1,
        rotation: 0,
        backgroundColor: "rgba(161, 161, 170, 0.72)",
        borderColor: "rgba(212, 212, 216, 0.5)",
      },
      {
        x: 72,
        scale: 1.2,
        rotation: 14,
        backgroundColor: sensorTelemetryIconPulsePeakColorHex,
        borderColor: sensorTelemetryIconPulsePeakColorHex,
        duration: 0.38,
        ease,
        yoyo: true,
        repeat: 1,
      },
    );
  };

  const triggerPreviewSample = () => {
    const next = Number(((Math.random() * 2 - 1) * 99).toFixed(2));
    const syntheticGapMs = 260;
    tweenRef.current?.kill();
    tweenRef.current = null;

    if (
      !sensorTelemetryValueTweenEnabled ||
      syntheticGapMs < sensorTelemetryInterpolationThresholdMs
    ) {
      setPreviewValue(next);
    } else {
      const durationMs = Math.max(
        sensorTelemetryInterpolationMinMs,
        Math.min(sensorTelemetryInterpolationMaxMs, syntheticGapMs),
      );
      const state = { v: previewValue };
      tweenRef.current = gsap.to(state, {
        v: next,
        duration: Math.max(0.05, durationMs / 1000),
        ease: sensorTelemetryValueTweenEase,
        onUpdate: () => {
          setPreviewValue(Number(state.v.toFixed(2)));
        },
        onComplete: () => {
          setPreviewValue(next);
          tweenRef.current = null;
        },
      });
    }

    triggerPulseBurst(1, 0);
    runMotionDemo();
  };

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (autoTriggerTimerRef.current != null) {
      clearTimeout(autoTriggerTimerRef.current);
    }
    // Coalesce rapid preset-driven updates into one preview trigger.
    autoTriggerTimerRef.current = setTimeout(() => {
      autoTriggerTimerRef.current = null;
      triggerPreviewSample();
    }, 90);
  }, [
    sensorTelemetryValueTweenEnabled,
    sensorTelemetryValueTweenEase,
    sensorTelemetryInterpolationThresholdMs,
    sensorTelemetryInterpolationMinMs,
    sensorTelemetryInterpolationMaxMs,
    sensorTelemetryIconPulseEnabled,
    sensorTelemetryIconPulseThrottleMs,
    sensorTelemetryIconPulseIntensityPreset,
    sensorTelemetryIconPulsePeakColorHex,
    sensorTelemetryIconPulseAnimationPreset,
    sensorTelemetryIconPulseColorAnimationEnabled,
  ]);

  useEffect(() => {
    if (prevMotionPresetRef.current === sensorTelemetryIconPulseAnimationPreset) {
      return;
    }
    prevMotionPresetRef.current = sensorTelemetryIconPulseAnimationPreset;
    // Motion preset needs a clearer visual cue than a single pulse.
    triggerPulseBurst(3, 180);
    runMotionDemo();
  }, [sensorTelemetryIconPulseAnimationPreset]);

  return (
    <div className="rounded border border-zinc-700/80 p-2">
      <div className="mb-2">
        <span className={SETTINGS_SECTION_TITLE_CLASS}>Animation preview</span>
      </div>
      <TRNParameter
        appearance="card"
        name={<span className="whitespace-nowrap">Preview value</span>}
        value={previewValue.toFixed(2)}
        unit=""
        icon={<Activity className="h-5 w-5" strokeWidth={2.25} aria-hidden />}
        nameColumnLayout="auto"
        positiveSignMode="always"
        iconPulseOnValueChange={sensorTelemetryIconPulseEnabled}
        // Preview should react to every parameter click, independent from runtime throttle.
        iconPulseThrottleMs={0}
        iconPulseIntensityPreset={sensorTelemetryIconPulseIntensityPreset}
        iconPulsePeakColorHex={sensorTelemetryIconPulsePeakColorHex}
        iconPulseAnimationPreset={sensorTelemetryIconPulseAnimationPreset}
        iconPulseColorAnimationEnabled={sensorTelemetryIconPulseColorAnimationEnabled}
        iconPulseTriggerKey={pulseKey}
        className="mb-2"
      />
      <div className="mt-2 rounded border border-zinc-700/80 bg-zinc-950/70 px-2 py-2">
        <div className="mb-1 text-[11px] text-zinc-400">Motion demo</div>
        <div className="relative h-6 overflow-hidden rounded border border-zinc-700/80 bg-zinc-900/70">
          <div
            ref={motionDotRef}
            className="absolute left-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300/50 bg-zinc-400/70"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

function RealtimeSettingsHeadingTooltip(props: {
  hint: ReactNode;
  children: ReactNode;
}) {
  const { hint, children } = props;
  return (
    <TRNTooltip
      content={<div className="whitespace-pre-line text-left leading-relaxed">{hint}</div>}
      trigger={children}
      placement="top-start"
      openDelayMs={350}
      collisionPadding={12}
      className="w-fit min-w-0 max-w-full"
      triggerClassName="!inline-flex max-w-full cursor-help items-center border-0 bg-transparent p-0 hover:bg-transparent focus-visible:ring-1 focus-visible:ring-zinc-500/50"
      panelClassName="!max-w-[min(280px,calc(100vw-24px))]"
      disableHoverFx
    />
  );
}

/** Viewport context for the settings dialog; sidebar card uses `full`. */
export type RealtimeUiSettingsScope = "full" | "quaternion" | "euler";

export function realtimeSettingsScopeFromPanelBadge(
  panelBadge: string | undefined,
): RealtimeUiSettingsScope {
  const b = panelBadge?.trim().toLowerCase() ?? "";
  if (b.includes("euler")) {
    return "euler";
  }
  if (b.includes("quaternion")) {
    return "quaternion";
  }
  return "full";
}

export type RealtimeUiSettingsFormProps = {
  /**
   * `full` — sidebar card; viewport dialogs may pass `quaternion` or `euler` for future scoped controls.
   * 3D preview spike gate and numeric deck smoothing are configured here.
   */
  scope?: RealtimeUiSettingsScope;
  /** Optional section filter for tabbed settings UI. */
  section?: "all" | "basic" | "advanced";
};

export function RealtimeUiSettingsForm(props: RealtimeUiSettingsFormProps) {
  const { section = "all" } = props;
  const showBasic = section === "all" || section === "basic";
  const showAdvanced = section === "all" || section === "advanced";
  const {
    uiFlushIntervalMs,
    setUiFlushIntervalMs,
    sensorTelemetryValueTweenEnabled,
    setSensorTelemetryValueTweenEnabled,
    sensorTelemetryValueTweenEase,
    setSensorTelemetryValueTweenEase,
    sensorTelemetryInterpolationThresholdMs,
    setSensorTelemetryInterpolationThresholdMs,
    sensorTelemetryInterpolationMinMs,
    setSensorTelemetryInterpolationMinMs,
    sensorTelemetryInterpolationMaxMs,
    setSensorTelemetryInterpolationMaxMs,
    sensorTelemetryIconPulseEnabled,
    setSensorTelemetryIconPulseEnabled,
    sensorTelemetryIconPulseThrottleMs,
    setSensorTelemetryIconPulseThrottleMs,
    sensorTelemetryIconPulseIntensityPreset,
    setSensorTelemetryIconPulseIntensityPreset,
    sensorTelemetryIconPulsePeakColorHex,
    setSensorTelemetryIconPulsePeakColorHex,
    sensorTelemetryIconPulseAnimationPreset,
    setSensorTelemetryIconPulseAnimationPreset,
    sensorTelemetryIconPulseColorAnimationEnabled,
    setSensorTelemetryIconPulseColorAnimationEnabled,
    fusionUpdateDeltaWarnMultiplier,
    setFusionUpdateDeltaWarnMultiplier,
    fusionUpdateDeltaBadMultiplier,
    setFusionUpdateDeltaBadMultiplier,
    fusionUpdateDeltaUseRamp,
    setFusionUpdateDeltaUseRamp,
    fusionUpdateDeltaGoodColorHex,
    setFusionUpdateDeltaGoodColorHex,
    fusionUpdateDeltaWarnColorHex,
    setFusionUpdateDeltaWarnColorHex,
    fusionUpdateDeltaBadColorHex,
    setFusionUpdateDeltaBadColorHex,
    telemetryUpdateBadgeMode,
    setTelemetryUpdateBadgeMode,
    telemetryUpdateDeltaSource,
    setTelemetryUpdateDeltaSource,
    autoRecoverStaleSensorDecodeEnabled,
    setAutoRecoverStaleSensorDecodeEnabled,
    sensorDecodeStaleIntervalMultiplier,
    setSensorDecodeStaleIntervalMultiplier,
    telemetryWedgeDiagnosticLogEnabled,
    setTelemetryWedgeDiagnosticLogEnabled,
    telemetryDecodeDebugEnabled,
    setTelemetryDecodeDebugEnabled,
    bmi270FusionQuatSpikeRejectEnabled,
    setBmi270FusionQuatSpikeRejectEnabled,
  } = useBitstreamConfig();

  const applyPresetOff = () => {
    setSensorTelemetryValueTweenEnabled(false);
    setSensorTelemetryIconPulseEnabled(false);
  };

  const applyPresetBalanced = () => {
    setSensorTelemetryValueTweenEnabled(true);
    setSensorTelemetryValueTweenEase("power1.out");
    setSensorTelemetryInterpolationThresholdMs(180);
    setSensorTelemetryInterpolationMinMs(400);
    setSensorTelemetryInterpolationMaxMs(2000);
    setSensorTelemetryIconPulseEnabled(true);
    setSensorTelemetryIconPulseThrottleMs(280);
    setSensorTelemetryIconPulseIntensityPreset("normal");
    setSensorTelemetryIconPulsePeakColorHex("#4ade80");
    setSensorTelemetryIconPulseAnimationPreset("smooth");
    setSensorTelemetryIconPulseColorAnimationEnabled(true);
  };

  const applyPresetSmooth = () => {
    setSensorTelemetryValueTweenEnabled(true);
    setSensorTelemetryValueTweenEase("power2.out");
    setSensorTelemetryInterpolationThresholdMs(350);
    setSensorTelemetryInterpolationMinMs(800);
    setSensorTelemetryInterpolationMaxMs(3500);
    setSensorTelemetryIconPulseEnabled(true);
    setSensorTelemetryIconPulseThrottleMs(320);
    setSensorTelemetryIconPulseIntensityPreset("strong");
    setSensorTelemetryIconPulsePeakColorHex("#22d3ee");
    setSensorTelemetryIconPulseAnimationPreset("elastic");
    setSensorTelemetryIconPulseColorAnimationEnabled(true);
  };

  const activeQuickPreset: string = (() => {
    if (!sensorTelemetryValueTweenEnabled && !sensorTelemetryIconPulseEnabled) {
      return "off";
    }

    const isBalanced =
      sensorTelemetryValueTweenEnabled &&
      sensorTelemetryValueTweenEase === "power1.out" &&
      sensorTelemetryInterpolationThresholdMs === 180 &&
      sensorTelemetryInterpolationMinMs === 400 &&
      sensorTelemetryInterpolationMaxMs === 2000 &&
      sensorTelemetryIconPulseEnabled &&
      sensorTelemetryIconPulseThrottleMs === 280 &&
      sensorTelemetryIconPulseIntensityPreset === "normal" &&
      sensorTelemetryIconPulsePeakColorHex.toLowerCase() === "#4ade80" &&
      sensorTelemetryIconPulseAnimationPreset === "smooth" &&
      sensorTelemetryIconPulseColorAnimationEnabled;
    if (isBalanced) {
      return "balanced";
    }

    const isSmooth =
      sensorTelemetryValueTweenEnabled &&
      sensorTelemetryValueTweenEase === "power2.out" &&
      sensorTelemetryInterpolationThresholdMs === 350 &&
      sensorTelemetryInterpolationMinMs === 800 &&
      sensorTelemetryInterpolationMaxMs === 3500 &&
      sensorTelemetryIconPulseEnabled &&
      sensorTelemetryIconPulseThrottleMs === 320 &&
      sensorTelemetryIconPulseIntensityPreset === "strong" &&
      sensorTelemetryIconPulsePeakColorHex.toLowerCase() === "#22d3ee" &&
      sensorTelemetryIconPulseAnimationPreset === "elastic" &&
      sensorTelemetryIconPulseColorAnimationEnabled;
    if (isSmooth) {
      return "smooth";
    }

    return "";
  })();

  const tweenEaseOptions = SENSOR_TELEMETRY_TWEEN_EASES.map((ease) => ({
    value: ease,
    label:
      ease === "none"
        ? "None"
        : ease === "power1.out"
          ? "Light"
          : "Smooth",
  }));

  const iconIntensityOptions = SENSOR_TELEMETRY_ICON_PULSE_INTENSITY_PRESETS.map((p) => ({
    value: p,
    label: p === "subtle" ? "Subtle" : p === "normal" ? "Normal" : "Strong",
  }));

  const iconAnimationOptions = SENSOR_TELEMETRY_ICON_PULSE_ANIMATION_PRESETS.map((p) => ({
    value: p,
    label:
      p === "smooth"
        ? "Smooth"
        : p === "elastic"
          ? "Elastic"
          : p === "back"
            ? "Back"
            : "Snappy",
  }));

  const peakHue = hexToHueDegrees(sensorTelemetryIconPulsePeakColorHex);
  const hueSliderEnabled =
    sensorTelemetryIconPulseEnabled && sensorTelemetryIconPulseColorAnimationEnabled;

  return (
    <div className="flex flex-col gap-3">
      {showBasic ? (
      <div className="rounded border border-zinc-700/80 p-2">
        <div className="mb-2">
          <RealtimeSettingsHeadingTooltip
            hint={
              "Coalescing interval for flushing live metrics to the UI.\nLower ms reacts faster and uses more CPU; higher ms batches more updates."
            }
          >
            <span
              className={`${SETTINGS_SECTION_TITLE_CLASS} underline decoration-dotted decoration-zinc-600/70 underline-offset-2`}
            >
              Live UI timing
            </span>
          </RealtimeSettingsHeadingTooltip>
        </div>
        <TRNParameterSlider
          appearance="default"
          name="UI Flush Interval"
          value={uiFlushIntervalMs}
          min={16}
          max={250}
          step={1}
          unit="ms"
          valueFormatter={(value) => `${Math.round(value)}`}
          icon={<Gauge className="h-4 w-4" strokeWidth={2.25} aria-hidden />}
          onChange={setUiFlushIntervalMs}
        />
        <TRNPresetGroup
          appearance="default"
          title="Preset"
          presets={[16, 33, 50, 100, 120, 250]}
          value={uiFlushIntervalMs}
          onSelect={setUiFlushIntervalMs}
          icon={<Gauge className="h-4 w-4" strokeWidth={2.25} aria-hidden />}
          className="mb-0"
          presetGridColumns={3}
        />
        <div className={`${SETTINGS_TOGGLE_ROW_CLASS} mt-2`}>
          <RealtimeSettingsHeadingTooltip
            hint={
              "Wire-rate fusion quaternion tap rejects single-frame orientation spikes before the 3D preview and quaternion wire plot.\n" +
              "Uses a rate-based max Δθ between consecutive accepted frames (hemisphere-aligned). Counter regressions are dropped.\n" +
              "Rejected count appears in the 3D viewport telemetry HUD. Disable only when debugging raw wire glitches."
            }
          >
            <span className="inline-flex items-center gap-1.5">
              <Box className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
              <span
                className={`${SETTINGS_FIELD_LABEL_CLASS} underline decoration-dotted decoration-zinc-600/70 underline-offset-2`}
              >
                Reject fusion quaternion spikes
              </span>
            </span>
          </RealtimeSettingsHeadingTooltip>
          <TRNToggleSwitch
            checked={bmi270FusionQuatSpikeRejectEnabled}
            onCheckedChange={setBmi270FusionQuatSpikeRejectEnabled}
            ariaLabel="Reject single-frame BMI270 fusion quaternion spikes in 3D preview"
          />
        </div>
        <div className={`${SETTINGS_TOGGLE_ROW_CLASS} mt-2`}>
          <RealtimeSettingsHeadingTooltip
            hint={
              "When any enabled sensor’s time since last decode exceeds samplingIntervalMs × multiplier, automatically resets HostSession (same as Reconnect telemetry).\n" +
              "Does not require serial disconnect — recovers wedged deframer / decode path on the same COM.\n" +
              "Cooldown 90 s between attempts; at most 3 per hour. Uses each sensor’s verified sampling interval from device config."
            }
          >
            <span className="inline-flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
              <span
                className={`${SETTINGS_FIELD_LABEL_CLASS} underline decoration-dotted decoration-zinc-600/70 underline-offset-2`}
              >
                Auto-recover stale sensor decode
              </span>
            </span>
          </RealtimeSettingsHeadingTooltip>
          <TRNToggleSwitch
            checked={autoRecoverStaleSensorDecodeEnabled}
            onCheckedChange={setAutoRecoverStaleSensorDecodeEnabled}
            ariaLabel="Auto-recover when sensor decode gap exceeds sampling interval multiplier"
          />
        </div>
        <div className="mt-2">
          <RealtimeSettingsHeadingTooltip
            hint={
              "Stale threshold per enabled sensor: wall-clock age since last decoded frame > samplingIntervalMs × this value.\n" +
              "Example: 25 ms interval × 2 → recover if no decode for > 50 ms (after ~250 ms sustain). Default multiplier is 2×."
            }
          >
            <span
              className={`${SETTINGS_GROUP_LABEL_CLASS} underline decoration-dotted decoration-zinc-600/70 underline-offset-2`}
            >
              Stale decode threshold multiplier
            </span>
          </RealtimeSettingsHeadingTooltip>
          <TRNPresetGroup
            appearance="default"
            title="× interval"
            presets={[2, 3, 4]}
            value={sensorDecodeStaleIntervalMultiplier}
            onSelect={(v) => setSensorDecodeStaleIntervalMultiplier(v as 2 | 3 | 4)}
            presetGridColumns={3}
            className="mb-0"
          />
        </div>
        <p className="mt-2 rounded border border-amber-900/40 bg-amber-950/25 px-2 py-1.5 text-[10px] leading-snug text-amber-100/85">
          Operational note: auto-reconnect only resets this tab&apos;s <span className="font-mono">HostSession</span>.
          If several browsers stall at the same time, investigate MCU / UART / bridge (shared path). Use{" "}
          <span className="font-medium">Telemetry diagnostics</span> (hamburger menu) for BRx, decode age, and reconnect.
        </p>
        <div className={`${SETTINGS_TOGGLE_ROW_CLASS} mt-2`}>
          <RealtimeSettingsHeadingTooltip
            hint={
              "When the wedge predicate first becomes true, writes one line to System logs with worst decode age, smoothed BRx, reject count, and sample count (no COM path).\n" +
              "Use for support bundles. Off by default."
            }
          >
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
              <span
                className={`${SETTINGS_FIELD_LABEL_CLASS} underline decoration-dotted decoration-zinc-600/70 underline-offset-2`}
              >
                Log wedge episodes
              </span>
            </span>
          </RealtimeSettingsHeadingTooltip>
          <TRNToggleSwitch
            checked={telemetryWedgeDiagnosticLogEnabled}
            onCheckedChange={setTelemetryWedgeDiagnosticLogEnabled}
            ariaLabel="Log telemetry wedge episodes to system log"
          />
        </div>
        <div className={`${SETTINGS_TOGGLE_ROW_CLASS} mt-2`}>
          <RealtimeSettingsHeadingTooltip
            hint={
              "Counts inbound Bitstream frames by wire channel for the current UART session and shows them in Telemetry diagnostics.\n" +
              "Also records the last transport disconnect reason when the bridge closes the socket.\n" +
              "Small per-frame cost; keep off during normal use."
            }
          >
            <span className="inline-flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
              <span
                className={`${SETTINGS_FIELD_LABEL_CLASS} underline decoration-dotted decoration-zinc-600/70 underline-offset-2`}
              >
                Telemetry decode debug
              </span>
            </span>
          </RealtimeSettingsHeadingTooltip>
          <TRNToggleSwitch
            checked={telemetryDecodeDebugEnabled}
            onCheckedChange={setTelemetryDecodeDebugEnabled}
            ariaLabel="Enable telemetry decode debug panel"
          />
        </div>
      </div>
      ) : null}

      {showAdvanced ? (
      <div className="rounded border border-zinc-700/80 p-2">
        <div className="mb-2">
          <RealtimeSettingsHeadingTooltip
            hint={
              "Controls the header badge content shown on telemetry cards.\n" +
              "Timestamp is host decode time in this webview.\n" +
              "Δt source (below) picks device firmware tMs spacing vs host ingest spacing."
            }
          >
            <span
              className={`${SETTINGS_SECTION_TITLE_CLASS} underline decoration-dotted decoration-zinc-600/70 underline-offset-2`}
            >
              Telemetry update badge
            </span>
          </RealtimeSettingsHeadingTooltip>
        </div>

        <div className="mb-2">
          <span className={SETTINGS_GROUP_LABEL_CLASS}>Show</span>
          <TRNSelect
            ariaLabel="Telemetry update badge mode"
            value={telemetryUpdateBadgeMode}
            size="sm"
            onValueChange={(v) => {
              if (v === "both" || v === "timestamp" || v === "delta" || v === "off") {
                setTelemetryUpdateBadgeMode(v);
              }
            }}
            options={[
              { value: "both", label: "Timestamp + Δt" },
              { value: "timestamp", label: "Timestamp" },
              { value: "delta", label: "Δt" },
              { value: "off", label: "Off" },
            ]}
          />
        </div>

        {(telemetryUpdateBadgeMode === "both" || telemetryUpdateBadgeMode === "delta") ? (
          <div className="mb-2">
            <RealtimeSettingsHeadingTooltip
              hint={
                "Device (firmware tMs): gap between consecutive EVT_SENSOR publishes on the MCU clock.\n" +
                "Host receive: gap between consecutive samples ingested in this webview.\n" +
                "Both: show firmware Δ and host Δ side by side ( 20.00 Δms  22.00 Δms, fixed width)."
              }
            >
              <span className={SETTINGS_GROUP_LABEL_CLASS}>Δt source</span>
            </RealtimeSettingsHeadingTooltip>
            <TRNSelect
              ariaLabel="Telemetry update delta source"
              value={telemetryUpdateDeltaSource}
              size="sm"
              onValueChange={(v) => {
                if (v === "device" || v === "host" || v === "both") {
                  setTelemetryUpdateDeltaSource(v);
                }
              }}
              options={[
                { value: "device", label: "Device (firmware tMs)" },
                { value: "host", label: "Host receive" },
                { value: "both", label: "Device + Host receive" },
              ]}
            />
          </div>
        ) : null}
      </div>
      ) : null}

      {showAdvanced ? (
      <div className="rounded border border-zinc-700/80 p-2">
        <div className="mb-2">
          <RealtimeSettingsHeadingTooltip
            hint={
              "Colors the Δt label on telemetry cards.\n" +
              "Δt follows the selected source (device tMs or host receive).\n" +
              "Compute ratio r = Δt / expected sampling interval (per sensor).\n" +
              "Green: r ≤ warn. Yellow: warn < r < bad. Red: r ≥ bad.\n" +
              "Ramp blends smoothly within bands; disable ramp for strict 3-step colors."
            }
          >
            <span
              className={`${SETTINGS_SECTION_TITLE_CLASS} underline decoration-dotted decoration-zinc-600/70 underline-offset-2`}
            >
              Telemetry update Δt colors
            </span>
          </RealtimeSettingsHeadingTooltip>
        </div>

        <div className={SETTINGS_TOGGLE_ROW_CLASS}>
          <span className={SETTINGS_FIELD_LABEL_CLASS}>Use color ramp</span>
          <TRNToggleSwitch
            checked={fusionUpdateDeltaUseRamp}
            onCheckedChange={setFusionUpdateDeltaUseRamp}
            ariaLabel="Toggle color ramp for fusion update delta"
          />
        </div>

        <TRNParameterSlider
          appearance="default"
          name="Warn threshold"
          value={fusionUpdateDeltaWarnMultiplier}
          min={1.0}
          max={3.0}
          step={0.05}
          unit="×"
          valueFormatter={(v) => v.toFixed(2)}
          icon={<Timer className="h-4 w-4" strokeWidth={2.25} aria-hidden />}
          onChange={setFusionUpdateDeltaWarnMultiplier}
        />
        <TRNParameterSlider
          appearance="default"
          name="Bad threshold"
          value={fusionUpdateDeltaBadMultiplier}
          min={1.05}
          max={4.0}
          step={0.05}
          unit="×"
          valueFormatter={(v) => v.toFixed(2)}
          icon={<Timer className="h-4 w-4" strokeWidth={2.25} aria-hidden />}
          onChange={setFusionUpdateDeltaBadMultiplier}
        />

        <div className="mt-2 grid grid-cols-1 gap-2">
          <div className="flex items-center justify-between gap-2 rounded border border-zinc-700/80 bg-transparent px-2 py-1">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="inline-flex h-3 w-3 shrink-0 rounded-sm border border-zinc-700/80"
                style={{ backgroundColor: fusionUpdateDeltaGoodColorHex }}
                aria-hidden
              />
              <span className="min-w-0 truncate text-xs font-medium text-zinc-200">Good color</span>
            </div>
            <TRNColorRingPicker
              ariaLabel="Pick good Δt color"
              valueHex={fusionUpdateDeltaGoodColorHex}
              onValueHexChange={setFusionUpdateDeltaGoodColorHex}
              size="sm"
              className="w-[140px]"
            />
          </div>

          <div className="flex items-center justify-between gap-2 rounded border border-zinc-700/80 bg-transparent px-2 py-1">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="inline-flex h-3 w-3 shrink-0 rounded-sm border border-zinc-700/80"
                style={{ backgroundColor: fusionUpdateDeltaWarnColorHex }}
                aria-hidden
              />
              <span className="min-w-0 truncate text-xs font-medium text-zinc-200">Warn color</span>
            </div>
            <TRNColorRingPicker
              ariaLabel="Pick warn Δt color"
              valueHex={fusionUpdateDeltaWarnColorHex}
              onValueHexChange={setFusionUpdateDeltaWarnColorHex}
              size="sm"
              className="w-[140px]"
            />
          </div>

          <div className="flex items-center justify-between gap-2 rounded border border-zinc-700/80 bg-transparent px-2 py-1">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="inline-flex h-3 w-3 shrink-0 rounded-sm border border-zinc-700/80"
                style={{ backgroundColor: fusionUpdateDeltaBadColorHex }}
                aria-hidden
              />
              <span className="min-w-0 truncate text-xs font-medium text-zinc-200">Bad color</span>
            </div>
            <TRNColorRingPicker
              ariaLabel="Pick bad Δt color"
              valueHex={fusionUpdateDeltaBadColorHex}
              onValueHexChange={setFusionUpdateDeltaBadColorHex}
              size="sm"
              className="w-[140px]"
            />
          </div>
        </div>
      </div>
      ) : null}

      {showAdvanced ? (
      <div className="rounded border border-zinc-700/80 p-2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <RealtimeSettingsHeadingTooltip
            hint={
              "Off disables numeric tween and icon pulse.\nBalanced and Smooth apply bundled easing, sparse-sample thresholds, throttle, intensity, and default peak colors (#4ade80 / #22d3ee)."
            }
          >
            <span
              className={`${SETTINGS_SECTION_TITLE_CLASS} underline decoration-dotted decoration-zinc-600/70 underline-offset-2`}
            >
              Quick presets
            </span>
          </RealtimeSettingsHeadingTooltip>
        </div>
        <RealtimeSettingsButtonChoiceGroup
          ariaLabel="Quick telemetry animation presets"
          value={activeQuickPreset}
          onValueChange={(v) => {
            if (v === "off") {
              applyPresetOff();
            } else if (v === "balanced") {
              applyPresetBalanced();
            } else if (v === "smooth") {
              applyPresetSmooth();
            }
          }}
          options={[
            { value: "off", label: "Off" },
            { value: "balanced", label: "Balanced" },
            { value: "smooth", label: "Smooth" },
          ]}
        />
      </div>
      ) : null}

      {showAdvanced ? (
      <RealtimeAnimationPreview
        sensorTelemetryValueTweenEnabled={sensorTelemetryValueTweenEnabled}
        sensorTelemetryValueTweenEase={sensorTelemetryValueTweenEase}
        sensorTelemetryInterpolationThresholdMs={sensorTelemetryInterpolationThresholdMs}
        sensorTelemetryInterpolationMinMs={sensorTelemetryInterpolationMinMs}
        sensorTelemetryInterpolationMaxMs={sensorTelemetryInterpolationMaxMs}
        sensorTelemetryIconPulseEnabled={sensorTelemetryIconPulseEnabled}
        sensorTelemetryIconPulseThrottleMs={sensorTelemetryIconPulseThrottleMs}
        sensorTelemetryIconPulseIntensityPreset={sensorTelemetryIconPulseIntensityPreset}
        sensorTelemetryIconPulsePeakColorHex={sensorTelemetryIconPulsePeakColorHex}
        sensorTelemetryIconPulseAnimationPreset={sensorTelemetryIconPulseAnimationPreset}
        sensorTelemetryIconPulseColorAnimationEnabled={sensorTelemetryIconPulseColorAnimationEnabled}
      />
      ) : null}

      {showAdvanced ? (
      <div className="rounded border border-zinc-700/80 p-2">
        <div className="mb-2">
          <RealtimeSettingsHeadingTooltip
            hint={
              "Smooths displayed numbers on the right-hand deck when samples are sparse.\nIf the stream interval is below the threshold, values snap to the wire; otherwise tween duration is clamped between min and max."
            }
          >
            <span
              className={`${SETTINGS_SECTION_TITLE_CLASS} underline decoration-dotted decoration-zinc-600/70 underline-offset-2`}
            >
              Value smoothing (GSAP)
            </span>
          </RealtimeSettingsHeadingTooltip>
        </div>
        <div className={SETTINGS_TOGGLE_ROW_CLASS}>
          <span className={SETTINGS_FIELD_LABEL_CLASS}>Tween sparse samples</span>
          <TRNToggleSwitch
            checked={sensorTelemetryValueTweenEnabled}
            onCheckedChange={setSensorTelemetryValueTweenEnabled}
            ariaLabel="Toggle numeric value tween for sparse telemetry samples"
          />
        </div>
        <div className="mb-2">
          <span className={SETTINGS_GROUP_LABEL_CLASS}>Ease</span>
          <RealtimeSettingsButtonChoiceGroup
            ariaLabel="GSAP ease for value tween"
            value={sensorTelemetryValueTweenEase}
            onValueChange={(v) => {
              setSensorTelemetryValueTweenEase(normalizeSensorTelemetryTweenEase(v));
            }}
            options={tweenEaseOptions}
            disabled={!sensorTelemetryValueTweenEnabled}
          />
        </div>
        <TRNParameterSlider
          appearance="default"
          name="Sparse threshold"
          value={sensorTelemetryInterpolationThresholdMs}
          min={50}
          max={500}
          step={1}
          unit="ms"
          valueFormatter={(v) => `${Math.round(v)}`}
          icon={<Timer className="h-4 w-4" strokeWidth={2.25} aria-hidden />}
          onChange={setSensorTelemetryInterpolationThresholdMs}
          disabled={!sensorTelemetryValueTweenEnabled}
        />
        <TRNParameterSlider
          appearance="default"
          name="Min tween"
          value={sensorTelemetryInterpolationMinMs}
          min={50}
          max={2000}
          step={10}
          unit="ms"
          valueFormatter={(v) => `${Math.round(v)}`}
          icon={<Timer className="h-4 w-4" strokeWidth={2.25} aria-hidden />}
          onChange={setSensorTelemetryInterpolationMinMs}
          disabled={!sensorTelemetryValueTweenEnabled}
        />
        <TRNParameterSlider
          appearance="default"
          name="Max tween"
          value={sensorTelemetryInterpolationMaxMs}
          min={200}
          max={5000}
          step={50}
          unit="ms"
          valueFormatter={(v) => `${Math.round(v)}`}
          icon={<Timer className="h-4 w-4" strokeWidth={2.25} aria-hidden />}
          onChange={setSensorTelemetryInterpolationMaxMs}
          disabled={!sensorTelemetryValueTweenEnabled}
        />
      </div>
      ) : null}

      {showAdvanced ? (
      <div className="rounded border border-zinc-700/80 p-2">
        <div className="mb-2 flex flex-row items-center gap-2">
          <RealtimeSettingsHeadingTooltip
            hint={
              "Brief scale and rotation on row icons when the live value changes.\nStyle sets motion strength. Motion picks GSAP easing (power / elastic / back / snappy). Color pulse tweens the icon stroke to the peak color; turn it off for motion only. Peak color is the stroke tint at the apex (#rrggbb) when color pulse is on. Separate from value tween. Honors prefers-reduced-motion."
            }
          >
            <span
              className={`inline-flex items-center gap-2 ${SETTINGS_SECTION_TITLE_CLASS} underline decoration-dotted decoration-zinc-600/70 underline-offset-2`}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
              Icon pulse (sensor deck)
            </span>
          </RealtimeSettingsHeadingTooltip>
        </div>
        <div className={SETTINGS_TOGGLE_ROW_CLASS}>
          <span className={SETTINGS_FIELD_LABEL_CLASS}>Pulse on change</span>
          <TRNToggleSwitch
            checked={sensorTelemetryIconPulseEnabled}
            onCheckedChange={setSensorTelemetryIconPulseEnabled}
            ariaLabel="Toggle icon pulse when live value changes"
          />
        </div>
        <TRNParameterSlider
          appearance="default"
          name="Throttle"
          value={sensorTelemetryIconPulseThrottleMs}
          min={80}
          max={600}
          step={10}
          unit="ms"
          valueFormatter={(v) => `${Math.round(v)}`}
          icon={<Activity className="h-4 w-4" strokeWidth={2.25} aria-hidden />}
          onChange={setSensorTelemetryIconPulseThrottleMs}
          disabled={!sensorTelemetryIconPulseEnabled}
        />
        <div className="mb-2">
          <span className={SETTINGS_GROUP_LABEL_CLASS}>Style</span>
          <RealtimeSettingsButtonChoiceGroup
            ariaLabel="Icon pulse intensity"
            value={sensorTelemetryIconPulseIntensityPreset}
            onValueChange={(v) => {
              setSensorTelemetryIconPulseIntensityPreset(
                normalizeSensorTelemetryIconPulseIntensityPreset(v),
              );
            }}
            options={iconIntensityOptions}
            disabled={!sensorTelemetryIconPulseEnabled}
          />
        </div>
        <div className="mb-2">
          <span className={SETTINGS_GROUP_LABEL_CLASS}>Motion</span>
          <RealtimeSettingsButtonChoiceGroup
            ariaLabel="Icon pulse GSAP ease family"
            value={sensorTelemetryIconPulseAnimationPreset}
            onValueChange={(v) => {
              setSensorTelemetryIconPulseAnimationPreset(
                normalizeSensorTelemetryIconPulseAnimationPreset(v),
              );
            }}
            options={iconAnimationOptions}
            disabled={!sensorTelemetryIconPulseEnabled}
          />
        </div>
        <div className={SETTINGS_TOGGLE_ROW_CLASS}>
          <span className={SETTINGS_FIELD_LABEL_CLASS}>Color pulse</span>
          <TRNToggleSwitch
            checked={sensorTelemetryIconPulseColorAnimationEnabled}
            onCheckedChange={setSensorTelemetryIconPulseColorAnimationEnabled}
            disabled={!sensorTelemetryIconPulseEnabled}
            ariaLabel="Toggle icon pulse peak color animation"
          />
        </div>
        <div>
          <span className={SETTINGS_GROUP_LABEL_CLASS}>
            Peak color
          </span>
          <div
            className={`rounded border border-zinc-700/80 bg-transparent px-2 py-2 ${
              hueSliderEnabled ? "" : "opacity-60"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                aria-hidden
                className="h-6 w-6 shrink-0 rounded border border-zinc-600/90"
                style={{ backgroundColor: sensorTelemetryIconPulsePeakColorHex }}
              />
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={peakHue}
                onChange={(e) => {
                  const hue = Number(e.currentTarget.value);
                  if (!Number.isFinite(hue)) {
                    return;
                  }
                  setSensorTelemetryIconPulsePeakColorHex(
                    normalizeSensorTelemetryIconPulsePeakColorHex(
                      hslToHex(hue, 82, 53),
                    ),
                  );
                }}
                disabled={!hueSliderEnabled}
                className="h-6 min-w-0 flex-1 cursor-pointer appearance-none rounded border border-zinc-700/80 bg-transparent px-1 disabled:cursor-not-allowed"
                style={{ background: HUE_BAR_GRADIENT }}
                aria-label="Peak color hue"
                title="Peak color hue"
              />
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span
                className={`min-w-0 font-mono text-xs ${
                  hueSliderEnabled ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                {sensorTelemetryIconPulsePeakColorHex}
              </span>
              <span
                className={`min-w-[7ch] text-right font-mono text-xs ${
                  hueSliderEnabled ? "text-zinc-300" : "text-zinc-600"
                }`}
              >
                {Math.round(peakHue)}deg
              </span>
            </div>
          </div>
        </div>
      </div>
      ) : null}
    </div>
  );
}
