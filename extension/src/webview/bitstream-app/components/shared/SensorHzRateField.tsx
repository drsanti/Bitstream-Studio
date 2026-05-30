import { TRNButton, TRNHintText, TRNRangeSlider } from "@/ui/TRN";
import {
  clampIntervalMs,
  hzFromIntervalMs,
  hzSliderBoundsFromPresets,
  hzSliderStepFromPresets,
  hzValueFromIntervalMs,
  intervalMsBoundsFromPresets,
  intervalMsFromHz,
  presetMatchesInterval,
  roundHzForSlider,
  snapHzToSliderStep,
  type HzPreset,
} from "../../../../bitstream2/domains/config/sensor-rate-presets";

export type SensorHzRateFieldProps = {
  presets: HzPreset[];
  intervalMs: number;
  disabled?: boolean;
  minMs?: number;
  maxMs?: number;
  /** When true, `0` is allowed (e.g. min publish off, telemetry same-as-sampling). */
  allowZero?: boolean;
  /** Hz slider step (left = low rate, right = high rate). Default 5. */
  sliderStepHz?: number;
  hint?: string;
  onIntervalMsChange: (intervalMs: number) => void;
};

export function SensorHzRateField({
  presets,
  intervalMs,
  disabled,
  minMs,
  maxMs,
  allowZero = false,
  sliderStepHz = 5,
  hint,
  onIntervalMsChange,
}: SensorHzRateFieldProps) {
  const presetBounds = intervalMsBoundsFromPresets(presets, allowZero);
  const clampMinMs = minMs ?? presetBounds.minMs;
  const clampMaxMs = maxMs ?? presetBounds.maxMs;
  const clampedMs =
    allowZero && intervalMs <= 0
      ? 0
      : clampIntervalMs(intervalMs, clampMinMs, clampMaxMs);
  const matchedHz = presetMatchesInterval(presets, clampedMs);

  const { minHz, maxHz } = hzSliderBoundsFromPresets(presets, allowZero);
  const presetStepHz = hzSliderStepFromPresets(presets);
  const effectiveStepHz =
    presetStepHz < sliderStepHz ? presetStepHz : sliderStepHz;

  const sliderHz =
    clampedMs <= 0
      ? 0
      : matchedHz != null
        ? matchedHz
        : roundHzForSlider(
            Math.max(minHz, Math.min(maxHz, hzValueFromIntervalMs(clampedMs))),
          );

  const handleSliderChange = (rawHz: number) => {
    if (allowZero && rawHz <= 0) {
      onIntervalMsChange(0);
      return;
    }
    const snapped = snapHzToSliderStep(rawHz, effectiveStepHz, minHz, maxHz);
    onIntervalMsChange(clampIntervalMs(intervalMsFromHz(snapped), clampMinMs, clampMaxMs));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <TRNButton
            key={`${p.hz}-${p.intervalMs}`}
            size="compact"
            className="min-w-14 flex-1 border-zinc-700/80"
            selected={matchedHz === p.hz}
            disabled={disabled}
            onClick={() => onIntervalMsChange(p.intervalMs)}
          >
            {p.label}
          </TRNButton>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <TRNRangeSlider
          className="min-w-0 flex-1 pb-0"
          min={minHz}
          max={maxHz}
          step={effectiveStepHz}
          value={sliderHz}
          disabled={disabled}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
        />
        <span className="shrink-0 text-xs font-medium text-emerald-400/90 tabular-nums">
          {hzFromIntervalMs(clampedMs)}
        </span>
      </div>
      {hint != null && hint.length > 0 ? (
        <TRNHintText tone="muted">{hint}</TRNHintText>
      ) : null}
    </div>
  );
}
