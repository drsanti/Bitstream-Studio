import { TRNInteractiveCard } from "@/ui/TRN";
import { Activity, Compass } from "lucide-react";
import { useMemo } from "react";
import type { BMM350DataViewerProps } from "../../types/sensorDeckCardFrame";
import { metricProgressPercent } from "../../telemetry/telemetryFormat";
import { useSensorLastUpdateBadge } from "../telemetry/useSensorLastUpdateBadge.js";
import { getBmi270AxisColorClass } from "../bmi270/bmi270AxisTelemetryStyles";
import { SensorMetricRow } from "../telemetry/SensorMetricRow";
import { LastUpdateBadge } from "../telemetry/LastUpdateBadge.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import {
  magnetometerMagnitudeUt,
  resolveMagnetometerGaugeLimits,
} from "../../telemetry/magnetometerDisplay.js";
import { Bmm350MagnetometerDisplaySettingsMenu } from "./Bmm350MagnetometerDisplaySettingsMenu.js";

export function BMM350DataViewer(props: BMM350DataViewerProps) {
  const {
    sample,
    samplingIntervalMs = 0,
    collapsed,
    onToggleCollapsed,
    dragHandleSlot,
  } = props;
  const updateBadge = useSensorLastUpdateBadge("bmm350", samplingIntervalMs);
  const showMagnitude = useBitstreamConfigStore((s) => s.bmm350MagShowMagnitude);
  const gaugeRange = useBitstreamConfigStore((s) => s.bmm350MagGaugeRange);

  const mxNum =
    typeof sample?.magneticXUtX100 === "number"
      ? sample.magneticXUtX100 / 100
      : undefined;
  const myNum =
    typeof sample?.magneticYUtX100 === "number"
      ? sample.magneticYUtX100 / 100
      : undefined;
  const mzNum =
    typeof sample?.magneticZUtX100 === "number"
      ? sample.magneticZUtX100 / 100
      : undefined;

  const magNum = magnetometerMagnitudeUt(mxNum, myNum, mzNum);
  const limits = useMemo(
    () => resolveMagnetometerGaugeLimits(gaugeRange, mxNum, myNum, mzNum, magNum),
    [gaugeRange, mxNum, myNum, mzNum, magNum],
  );

  const mx = typeof mxNum === "number" ? mxNum.toFixed(2) : "--";
  const my = typeof myNum === "number" ? myNum.toFixed(2) : "--";
  const mz = typeof mzNum === "number" ? mzNum.toFixed(2) : "--";
  const magText = typeof magNum === "number" ? magNum.toFixed(2) : "--";

  return (
    <TRNInteractiveCard
      title="BMM350 Magnetometer"
      titleLeadingSlot={
        <div className="inline-flex items-center gap-1">
          {dragHandleSlot != null ? dragHandleSlot : null}
          <Compass
            className="h-4 w-4 shrink-0 text-zinc-400"
            strokeWidth={2.25}
            aria-hidden
          />
        </div>
      }
      titleTrailingSlot={
        <div className="inline-flex shrink-0 items-center gap-1.5">
          {updateBadge != null ? <LastUpdateBadge {...updateBadge} /> : null}
          <Bmm350MagnetometerDisplaySettingsMenu />
        </div>
      }
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      shell="solid"
      className="h-auto"
      collapsible={onToggleCollapsed != null}
      collapsed={collapsed}
      onCollapsedChange={(nextCollapsed) => {
        if (onToggleCollapsed == null) return;
        if (nextCollapsed !== collapsed) onToggleCollapsed();
      }}
      contentClassName="min-h-0"
    >
      <div className="flex flex-col gap-2">
        {showMagnitude ? (
          <SensorMetricRow
            name="|B|"
            value={magText}
            unit="uT"
            hint={
              "Field magnitude |B|\nUnit: µT\nsqrt(mx² + my² + mz²)\nDisplay-only; gauge range from header menu."
            }
            progressPercent={metricProgressPercent(
              magNum,
              limits.magnitudeMin,
              limits.magnitudeMax,
            )}
            fillColor="#a855f7"
            iconColorOnIcon
            rawNumeric={magNum}
            gaugeMin={limits.magnitudeMin}
            gaugeMax={limits.magnitudeMax}
            samplingIntervalMs={samplingIntervalMs}
            icon={
              <Compass className="h-4 w-4 text-purple-400" strokeWidth={2.25} aria-hidden />
            }
          />
        ) : null}
        <SensorMetricRow
          name="mx"
          value={mx}
          unit="uT"
          positiveSignMode="always"
          hint={"Magnetic X\nUnit: µT\nGauge range from header menu.\nMagnetic field X axis."}
          progressPercent={metricProgressPercent(mxNum, limits.axisMin, limits.axisMax)}
          fillColor="#ef4444"
          iconColorOnIcon
          rawNumeric={mxNum}
          gaugeMin={limits.axisMin}
          gaugeMax={limits.axisMax}
          samplingIntervalMs={samplingIntervalMs}
          icon={
            <Activity
              className={`h-4 w-4 ${getBmi270AxisColorClass("mx")}`}
              strokeWidth={2.25}
              aria-hidden
            />
          }
        />
        <SensorMetricRow
          name="my"
          value={my}
          unit="uT"
          positiveSignMode="always"
          hint={"Magnetic Y\nUnit: µT\nGauge range from header menu.\nMagnetic field Y axis."}
          progressPercent={metricProgressPercent(myNum, limits.axisMin, limits.axisMax)}
          fillColor="#22c55e"
          iconColorOnIcon
          rawNumeric={myNum}
          gaugeMin={limits.axisMin}
          gaugeMax={limits.axisMax}
          samplingIntervalMs={samplingIntervalMs}
          icon={
            <Activity
              className={`h-4 w-4 ${getBmi270AxisColorClass("my")}`}
              strokeWidth={2.25}
              aria-hidden
            />
          }
        />
        <SensorMetricRow
          name="mz"
          value={mz}
          unit="uT"
          positiveSignMode="always"
          hint={"Magnetic Z\nUnit: µT\nGauge range from header menu.\nMagnetic field Z axis."}
          progressPercent={metricProgressPercent(mzNum, limits.axisMin, limits.axisMax)}
          fillColor="#3b82f6"
          iconColorOnIcon
          rawNumeric={mzNum}
          gaugeMin={limits.axisMin}
          gaugeMax={limits.axisMax}
          samplingIntervalMs={samplingIntervalMs}
          icon={
            <Activity
              className={`h-4 w-4 ${getBmi270AxisColorClass("mz")}`}
              strokeWidth={2.25}
              aria-hidden
            />
          }
        />
      </div>
    </TRNInteractiveCard>
  );
}
