import { TRNInteractiveCard } from "@/ui/TRN";
import { Droplets, Thermometer } from "lucide-react";
import type { SHT40DataViewerProps } from "../../types/sensorDeckCardFrame";
import { metricProgressPercent } from "../../telemetry/telemetryFormat";
import { useSensorLastUpdateBadge } from "../telemetry/useSensorLastUpdateBadge.js";
import { SensorMetricRow } from "../telemetry/SensorMetricRow";
import { LastUpdateBadge } from "../telemetry/LastUpdateBadge.js";
import { TemperatureDisplaySettingsMenu } from "../telemetry/TemperatureDisplaySettingsMenu.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import { convertTemperatureCToUnit, formatTemperatureFromC, readTemperatureCFromSample } from "../../telemetry/temperatureDisplay.js";

/** Short deck row labels; full wording stays in each row `hint` (sensor deck convention). */
const SHT40_ROW_HU = "hu";
const SHT40_ROW_TP = "tp";

export function SHT40DataViewer(props: SHT40DataViewerProps) {
  const {
    sample,
    samplingIntervalMs = 0,
    collapsed,
    onToggleCollapsed,
    dragHandleSlot,
    variant = "environment",
  } = props;
  const updateBadge = useSensorLastUpdateBadge("sht40", samplingIntervalMs);
  const temperatureUnit = useBitstreamConfigStore((s) => s.temperatureDisplayUnit);
  const temperatureDigits = useBitstreamConfigStore((s) => s.temperatureDisplayFractionDigits);
  const hdNum =
    typeof sample?.secondaryX100 === "number"
      ? sample.secondaryX100 / 100
      : undefined;
  const tpNum = readTemperatureCFromSample(sample);
  const hd = typeof hdNum === "number" ? hdNum.toFixed(2) : "--";
  const tpDisplay = formatTemperatureFromC(tpNum, temperatureUnit, temperatureDigits);
  const gaugeMin = convertTemperatureCToUnit(0, temperatureUnit);
  const gaugeMax = convertTemperatureCToUnit(60, temperatureUnit);

  const title =
    variant === "humidity"
      ? "SHT40 Humidity"
      : variant === "temperature"
        ? "SHT40 Temperature"
        : "SHT40 Environment";

  const headerIcon =
    variant === "temperature" ? (
      <Thermometer
        className="h-4 w-4 shrink-0 text-zinc-400"
        strokeWidth={2.25}
        aria-hidden
      />
    ) : (
      <Droplets
        className="h-4 w-4 shrink-0 text-zinc-400"
        strokeWidth={2.25}
        aria-hidden
      />
    );

  const showHumidity = variant === "environment" || variant === "humidity";
  const showTemperature = variant === "environment" || variant === "temperature";

  return (
    <TRNInteractiveCard
      title={title}
      titleLeadingSlot={
        <div className="inline-flex items-center gap-1">
          {dragHandleSlot != null ? dragHandleSlot : null}
          {variant === "environment" ? (
            <>
              <Droplets
                className="h-4 w-4 shrink-0 text-zinc-400"
                strokeWidth={2.25}
                aria-hidden
              />
              <Thermometer
                className="h-4 w-4 shrink-0 text-zinc-400"
                strokeWidth={2.25}
                aria-hidden
              />
            </>
          ) : (
            headerIcon
          )}
        </div>
      }
      titleTrailingSlot={
        <div className="inline-flex shrink-0 items-center gap-1.5">
          {updateBadge != null ? <LastUpdateBadge {...updateBadge} /> : null}
          {showTemperature ? <TemperatureDisplaySettingsMenu /> : null}
        </div>
      }
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      className="h-auto rounded-md border-zinc-700/80 bg-black/40 p-2"
      collapsible={onToggleCollapsed != null}
      collapsed={collapsed}
      onCollapsedChange={(nextCollapsed) => {
        if (onToggleCollapsed == null) return;
        if (nextCollapsed !== collapsed) onToggleCollapsed();
      }}
      contentClassName="min-h-0"
    >
      <div className="flex flex-col gap-2">
        {showHumidity ? (
          <SensorMetricRow
            name={SHT40_ROW_HU}
            value={hd}
            unit="%"
            hint={
              "Relative humidity (SHT40)\nUnit: %RH\nRange (gauge): 0–100\nsecondaryX100 → % in stream."
            }
            progressPercent={metricProgressPercent(
              typeof sample?.secondaryX100 === "number"
                ? sample.secondaryX100 / 100
                : undefined,
              0,
              100,
            )}
            fillColor="#14b8a6"
            iconColorOnIcon
            rawNumeric={hdNum}
            gaugeMin={0}
            gaugeMax={100}
            samplingIntervalMs={samplingIntervalMs}
            icon={
              <Droplets className="h-4 w-4 text-teal-500" strokeWidth={2.25} aria-hidden />
            }
          />
        ) : null}
        {showTemperature ? (
          <SensorMetricRow
            name={SHT40_ROW_TP}
            value={tpDisplay.text}
            unit={tpDisplay.unitLabel}
            hint={"Temperature\nGlobal unit/precision options in the header.\nSHT40 ambient temperature."}
            progressPercent={metricProgressPercent(
              tpDisplay.numeric,
              gaugeMin,
              gaugeMax,
            )}
            fillColor="#fb923c"
            iconColorOnIcon
            rawNumeric={tpDisplay.numeric}
            gaugeMin={gaugeMin}
            gaugeMax={gaugeMax}
            samplingIntervalMs={samplingIntervalMs}
            icon={
              <Thermometer className="h-4 w-4 text-orange-400" strokeWidth={2.25} aria-hidden />
            }
          />
        ) : null}
      </div>
    </TRNInteractiveCard>
  );
}
