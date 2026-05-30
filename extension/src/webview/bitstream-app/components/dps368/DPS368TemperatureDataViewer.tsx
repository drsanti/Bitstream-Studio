import { TRNInteractiveCard } from "@/ui/TRN";
import { Thermometer } from "lucide-react";
import type { DPS368DataViewerProps } from "../../types/sensorDeckCardFrame";
import { metricProgressPercent } from "../../telemetry/telemetryFormat";
import { useSensorLastUpdateBadge } from "../telemetry/useSensorLastUpdateBadge.js";
import { SensorMetricRow } from "../telemetry/SensorMetricRow";
import { LastUpdateBadge } from "../telemetry/LastUpdateBadge.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import { formatTemperatureFromC, convertTemperatureCToUnit } from "../../telemetry/temperatureDisplay.js";
import { TemperatureDisplaySettingsMenu } from "../telemetry/TemperatureDisplaySettingsMenu.js";

export function DPS368TemperatureDataViewer(props: DPS368DataViewerProps) {
  const {
    sample,
    samplingIntervalMs = 0,
    collapsed,
    onToggleCollapsed,
    dragHandleSlot,
  } = props;
  const updateBadge = useSensorLastUpdateBadge("dps368", samplingIntervalMs);
  const temperatureUnit = useBitstreamConfigStore((s) => s.temperatureDisplayUnit);
  const temperatureDigits = useBitstreamConfigStore((s) => s.temperatureDisplayFractionDigits);
  const tpNumeric =
    typeof sample?.temperatureCx100 === "number"
      ? sample.temperatureCx100 / 100
      : undefined;
  const tpDisplay = formatTemperatureFromC(tpNumeric, temperatureUnit, temperatureDigits);
  const gaugeMin = convertTemperatureCToUnit(0, temperatureUnit);
  const gaugeMax = convertTemperatureCToUnit(60, temperatureUnit);

  return (
    <TRNInteractiveCard
      title="DPS368 Temperature"
      titleLeadingSlot={
        <div className="inline-flex items-center gap-1">
          {dragHandleSlot != null ? dragHandleSlot : null}
          <Thermometer className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2.25} aria-hidden />
        </div>
      }
      titleTrailingSlot={
        <div className="inline-flex shrink-0 items-center gap-1.5">
          {updateBadge != null ? <LastUpdateBadge {...updateBadge} /> : null}
          <TemperatureDisplaySettingsMenu />
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
        <SensorMetricRow
          name="tp"
          value={tpDisplay.text}
          unit={tpDisplay.unitLabel}
          hint={"Temperature\nGlobal unit/precision options in the header.\nDPS368 internal temperature."}
          progressPercent={metricProgressPercent(tpDisplay.numeric, gaugeMin, gaugeMax)}
          fillColor="#fb923c"
          iconColorOnIcon
          rawNumeric={tpDisplay.numeric}
          gaugeMin={gaugeMin}
          gaugeMax={gaugeMax}
          samplingIntervalMs={samplingIntervalMs}
          icon={<Thermometer className="h-4 w-4 text-orange-400" strokeWidth={2.25} aria-hidden />}
        />
      </div>
    </TRNInteractiveCard>
  );
}

