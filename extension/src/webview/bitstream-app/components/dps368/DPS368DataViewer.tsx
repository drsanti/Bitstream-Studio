import { TRNInteractiveCard } from "@/ui/TRN";
import { Gauge } from "lucide-react";
import { useMemo } from "react";
import type { DPS368DataViewerProps } from "../../types/sensorDeckCardFrame";
import {
  sensorDeckCardChromeProps,
  sensorDeckShowsDisplaySettings,
  sensorDeckShowsUpdateBadge,
} from "../../types/sensorDeckCardFrame";
import { metricProgressPercent } from "../../telemetry/telemetryFormat";
import { useSensorLastUpdateBadge } from "../telemetry/useSensorLastUpdateBadge.js";
import { SensorMetricRow } from "../telemetry/SensorMetricRow";
import { LastUpdateBadge } from "../telemetry/LastUpdateBadge.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import {
  formatPressureFromWireHpa,
  pressureHpaFromWireSecondaryX100,
  resolvePressureGaugeLimits,
} from "../../telemetry/pressureDisplay.js";
import { Dps368PressureDisplaySettingsMenu } from "./Dps368PressureDisplaySettingsMenu.js";

export function DPS368DataViewer(props: DPS368DataViewerProps) {
  const {
    sample,
    samplingIntervalMs = 0,
    collapsed,
    onToggleCollapsed,
    dragHandleSlot,
    showUpdateBadge,
    showDisplaySettings,
  } = props;
  const updateBadge = useSensorLastUpdateBadge("dps368", samplingIntervalMs);
  const pressureUnit = useBitstreamConfigStore((s) => s.dps368PressureDisplayUnit);
  const pressureDigits = useBitstreamConfigStore((s) => s.dps368PressureDisplayFractionDigits);
  const gaugeRange = useBitstreamConfigStore((s) => s.dps368PressureGaugeRange);

  const pressureHpa =
    typeof sample?.secondaryX100 === "number"
      ? pressureHpaFromWireSecondaryX100(sample.secondaryX100)
      : undefined;

  const display = formatPressureFromWireHpa(pressureHpa, pressureUnit, pressureDigits);
  const limits = useMemo(
    () => resolvePressureGaugeLimits(gaugeRange, pressureHpa, pressureUnit),
    [gaugeRange, pressureHpa, pressureUnit],
  );

  return (
    <TRNInteractiveCard
      title="DPS368 Pressure"
      titleLeadingSlot={
        <div className="inline-flex items-center gap-1">
          {dragHandleSlot != null ? dragHandleSlot : null}
          <Gauge
            className="h-4 w-4 shrink-0 text-zinc-400"
            strokeWidth={2.25}
            aria-hidden
          />
        </div>
      }
      titleTrailingSlot={
        <div className="inline-flex shrink-0 items-center gap-1.5">
          {sensorDeckShowsUpdateBadge({ showUpdateBadge }) && updateBadge != null ? (
            <LastUpdateBadge {...updateBadge} />
          ) : null}
          {sensorDeckShowsDisplaySettings({ showDisplaySettings }) ? (
            <Dps368PressureDisplaySettingsMenu />
          ) : null}
        </div>
      }
      {...sensorDeckCardChromeProps(props)}
      collapsible={onToggleCollapsed != null}
      collapsed={collapsed}
      onCollapsedChange={(nextCollapsed) => {
        if (onToggleCollapsed == null) return;
        if (nextCollapsed !== collapsed) onToggleCollapsed();
      }}
      contentClassName="min-h-0"
    >
      <div className="flex flex-col gap-2">
        <SensorMetricRow
          name="pr"
          value={display.text}
          unit={display.unitLabel}
          hint={
            "Barometric pressure (DPS368)\nUnit and gauge range from header menu.\nWire: hPa×10 in secondaryX100."
          }
          progressPercent={metricProgressPercent(
            display.numeric,
            limits.gaugeMin,
            limits.gaugeMax,
          )}
          fillColor="#22d3ee"
          iconColorOnIcon
          rawNumeric={display.numeric}
          gaugeMin={limits.gaugeMin}
          gaugeMax={limits.gaugeMax}
          fractionDigits={pressureDigits}
          samplingIntervalMs={samplingIntervalMs}
          icon={<Gauge className="h-4 w-4 text-cyan-400" strokeWidth={2.25} aria-hidden />}
        />
      </div>
    </TRNInteractiveCard>
  );
}
