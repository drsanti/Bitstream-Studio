import {
  TRNDragHandle,
  TRNInteractiveCard,
  TRNParameter,
} from "@/ui/TRN";
import {
  toTrnIconPulseAnimationPreset,
  toTrnIconPulseIntensityPreset,
} from "../../../ui/TRN/trnIconPulsePresets.js";
import { Activity } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { BitstreamSensorSourceHint } from "../../../../bitstream/events/sensor-decoder.js";
import {
  TELEMETRY_META_HINT_BMI270_STREAM_RATE,
  TELEMETRY_META_HINT_BMM350_STREAM_RATE,
  TELEMETRY_META_HINT_DPS368_STREAM_RATE,
  TELEMETRY_META_HINT_SHT40_STREAM_RATE,
} from "../../constants/telemetryMetaHints.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import { useBitstreamLiveStore } from "../../state/bitstreamLive.store.js";
import {
  buildTelemetryMetaRowDisplay,
  pickTelemetryMetaHz,
  telemetryMetaRowLabel,
} from "../../utils/telemetryMetaDisplay.js";
import { TelemetryMetaSettingsMenu } from "./TelemetryMetaSettingsMenu.js";

export type TelemetryMetaCardProps = {
  dps368StreamCounter: string;
  bmi270StreamCounter: string;
  sht40StreamCounter: string;
  bmm350StreamCounter: string;
  hintDps368: string;
  hintBmi270: string;
  hintSht40: string;
  hintBmm350: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** When false, the BMI270 sample counter row is omitted. Default true. */
  showBmi270StreamCounter?: boolean;
  /** When false, the DPS368 sample counter row is omitted. Default true. */
  showDps368StreamCounter?: boolean;
  /** When false, the SHT40 sample counter row is omitted. Default true. */
  showSht40StreamCounter?: boolean;
  /** When false, the BMM350 sample counter row is omitted. Default true. */
  showBmm350StreamCounter?: boolean;
  /** When false, header has no drag handle (e.g. docked inspector panel). Default true. */
  showDragHandle?: boolean;
  className?: string;
};

const STREAM_RATE_HINT_BY_HINT: Record<
  Exclude<BitstreamSensorSourceHint, "unknown">,
  string
> = {
  dps368: TELEMETRY_META_HINT_DPS368_STREAM_RATE,
  bmi270: TELEMETRY_META_HINT_BMI270_STREAM_RATE,
  sht40: TELEMETRY_META_HINT_SHT40_STREAM_RATE,
  bmm350: TELEMETRY_META_HINT_BMM350_STREAM_RATE,
};

type MetaRowConfig = {
  sensorLabel: string;
  hint: Exclude<BitstreamSensorSourceHint, "unknown">;
  counterText: string;
  counterHint: string;
  show: boolean;
};

function resolveMetaRowHint(
  mode: "counter" | "hz" | "both",
  counterHint: string,
  rateHint: string,
): string {
  if (mode === "counter")
  {
    return counterHint;
  }
  if (mode === "hz")
  {
    return rateHint;
  }
  return `${counterHint}\n\n${rateHint}`;
}

/** Protocol sample counters and stream rates (sensor workspace / telemetry sidebar). */
export function TelemetryMetaCard(props: TelemetryMetaCardProps) {
  const {
    dps368StreamCounter,
    bmi270StreamCounter,
    sht40StreamCounter,
    bmm350StreamCounter,
    hintDps368,
    hintBmi270,
    hintSht40,
    hintBmm350,
    collapsible = false,
    collapsed,
    onCollapsedChange,
    showBmi270StreamCounter = true,
    showDps368StreamCounter = true,
    showSht40StreamCounter = true,
    showBmm350StreamCounter = true,
    showDragHandle = true,
    className: rootClassName = "",
  } = props;

  const {
    sensorTelemetryIconPulseEnabled,
    sensorTelemetryIconPulseThrottleMs,
    sensorTelemetryIconPulseIntensityPreset,
    sensorTelemetryIconPulsePeakColorHex,
    sensorTelemetryIconPulseAnimationPreset,
    sensorTelemetryIconPulseColorAnimationEnabled,
    telemetryMetaDisplayMode,
    telemetryMetaRateSource,
  } = useBitstreamConfigStore(
    useShallow((s) => ({
      sensorTelemetryIconPulseEnabled: s.sensorTelemetryIconPulseEnabled,
      sensorTelemetryIconPulseThrottleMs: s.sensorTelemetryIconPulseThrottleMs,
      sensorTelemetryIconPulseIntensityPreset: s.sensorTelemetryIconPulseIntensityPreset,
      sensorTelemetryIconPulsePeakColorHex: s.sensorTelemetryIconPulsePeakColorHex,
      sensorTelemetryIconPulseAnimationPreset: s.sensorTelemetryIconPulseAnimationPreset,
      sensorTelemetryIconPulseColorAnimationEnabled: s.sensorTelemetryIconPulseColorAnimationEnabled,
      telemetryMetaDisplayMode: s.telemetryMetaDisplayMode,
      telemetryMetaRateSource: s.telemetryMetaRateSource,
    })),
  );

  const streamHzMaps = useBitstreamLiveStore(
    useShallow((s) => ({
      streamHzDeviceByHint: s.streamHzDeviceByHint,
      streamHzHostByHint: s.streamHzHostByHint,
      streamHzCounterByHint: s.streamHzCounterByHint,
      streamHzSmoothedByHint: s.streamHzSmoothedByHint,
    })),
  );

  const rows: MetaRowConfig[] = useMemo(
    () => [
      {
        sensorLabel: "DPS368",
        hint: "dps368",
        counterText: dps368StreamCounter,
        counterHint: hintDps368,
        show: showDps368StreamCounter,
      },
      {
        sensorLabel: "BMI270",
        hint: "bmi270",
        counterText: bmi270StreamCounter,
        counterHint: hintBmi270,
        show: showBmi270StreamCounter,
      },
      {
        sensorLabel: "SHT40",
        hint: "sht40",
        counterText: sht40StreamCounter,
        counterHint: hintSht40,
        show: showSht40StreamCounter,
      },
      {
        sensorLabel: "BMM350",
        hint: "bmm350",
        counterText: bmm350StreamCounter,
        counterHint: hintBmm350,
        show: showBmm350StreamCounter,
      },
    ],
    [
      bmi270StreamCounter,
      bmm350StreamCounter,
      dps368StreamCounter,
      hintBmi270,
      hintBmm350,
      hintDps368,
      hintSht40,
      sht40StreamCounter,
      showBmi270StreamCounter,
      showBmm350StreamCounter,
      showDps368StreamCounter,
      showSht40StreamCounter,
    ],
  );

  const dragLeading: ReactNode = (
    <div className="inline-flex items-center gap-1">
      <TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />
    </div>
  );

  return (
    <TRNInteractiveCard
      title="Telemetry Meta"
      titleLeadingSlot={showDragHandle ? dragLeading : undefined}
      titleTrailingSlot={<TelemetryMetaSettingsMenu />}
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      className={`h-auto ${rootClassName}`.trim()}
      collapsible={collapsible}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      contentClassName="min-h-0"
    >
      <div className="flex w-full min-w-0 flex-col gap-2">
        {rows.map((row) => {
          if (!row.show)
          {
            return null;
          }

          const hz = pickTelemetryMetaHz({
            rateSource: telemetryMetaRateSource,
            hint: row.hint,
            ...streamHzMaps,
          });
          const display = buildTelemetryMetaRowDisplay({
            displayMode: telemetryMetaDisplayMode,
            counterText: row.counterText,
            hz,
          });
          const rowHint = resolveMetaRowHint(
            telemetryMetaDisplayMode,
            row.counterHint,
            STREAM_RATE_HINT_BY_HINT[row.hint],
          );

          return (
            <TRNParameter
              key={row.hint}
              name={
                <span className="whitespace-nowrap">
                  {telemetryMetaRowLabel(row.sensorLabel, telemetryMetaDisplayMode)}
                </span>
              }
              nameColumnLayout="auto"
              valueColumnLayout="auto"
              valueTruncate={false}
              unitColumnClassName="w-[3ch]"
              rowSpan="full"
              hint={rowHint}
              value={display.value}
              unit={display.unit}
              iconPulseOnValueChange={sensorTelemetryIconPulseEnabled}
              iconPulseThrottleMs={sensorTelemetryIconPulseThrottleMs}
              iconPulseIntensityPreset={toTrnIconPulseIntensityPreset(
                sensorTelemetryIconPulseIntensityPreset,
              )}
              iconPulsePeakColorHex={sensorTelemetryIconPulsePeakColorHex}
              iconPulseAnimationPreset={toTrnIconPulseAnimationPreset(
                sensorTelemetryIconPulseAnimationPreset,
              )}
              iconPulseColorAnimationEnabled={sensorTelemetryIconPulseColorAnimationEnabled}
              iconPulseTriggerKey={display.pulseKey}
              icon={<Activity className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />}
            />
          );
        })}
      </div>
    </TRNInteractiveCard>
  );
}
