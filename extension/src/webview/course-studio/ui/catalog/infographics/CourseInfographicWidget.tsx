import type { WidgetBoardWidgetTypographyV1 } from "../../../schemas/widgetBoard.v1";
import type { CourseBindingHealthStatus } from "../../../runtime/courseBindingHealth";
import { courseBindingHealthToSensorHealth } from "../../../runtime/courseBindingHealth";
import type { SensorHealthStatus } from "../../../../sensor-studio/features/editor/store/flow-editor.store";
import { useWidgetBoardSmoothedRatio } from "../widget-board/useWidgetBoardSmoothedRatio";
import {
  normalizeInfographicAngleDeg,
  normalizeInfographicRatio,
} from "./infographicGeometry";
import {
  readInfographicSkinConfig,
  resolveInfographicValueMode,
  type InfographicVisualPresetId,
} from "./infographicVisualPreset";
import { InfographicBatterySegmentedSkin } from "./skins/svg/InfographicBatterySegmentedSkin";
import { InfographicCompassRoseSkin } from "./skins/svg/InfographicCompassRoseSkin";
import { InfographicDropletFillSkin } from "./skins/svg/InfographicDropletFillSkin";
import { InfographicManometerColumnSkin } from "./skins/svg/InfographicManometerColumnSkin";
import { InfographicSevenSegmentSkin } from "./skins/svg/InfographicSevenSegmentSkin";
import { InfographicThermometerMercurySkin } from "./skins/svg/InfographicThermometerMercurySkin";
import {
  pickWidgetBoardTileShellProps,
  type WidgetBoardReadoutLayoutConfig,
  type WidgetBoardTileLayoutConfig,
} from "../widget-board/widgetBoardReadoutLayout";
import { WidgetBoardTileShell } from "../widget-board/WidgetBoardTileShell";

export type CourseInfographicWidgetProps = {
  preset: Exclude<InfographicVisualPresetId, "abstract">;
  label: string;
  value: number | null;
  unit?: string;
  min: number;
  max: number;
  decimals: number;
  showLabel?: boolean;
  showValue?: boolean;
  showUnit?: boolean;
  health?: CourseBindingHealthStatus;
  configSource?: Record<string, unknown>;
  typography?: WidgetBoardWidgetTypographyV1;
  readoutLayout?: WidgetBoardReadoutLayoutConfig & WidgetBoardTileLayoutConfig;
  className?: string;
};

export function CourseInfographicWidget({
  preset,
  label,
  value,
  unit,
  min,
  max,
  decimals,
  showLabel = true,
  showValue = true,
  showUnit = true,
  health,
  configSource,
  readoutLayout,
  className,
}: CourseInfographicWidgetProps) {
  const config = readInfographicSkinConfig(configSource);
  const layoutConfig = readoutLayout ?? {};
  const valueMode = resolveInfographicValueMode(preset);
  const targetRatio = normalizeInfographicRatio(value, min, max) ?? 0;
  const displayRatio = useWidgetBoardSmoothedRatio(targetRatio, config.fillSmoothingMs);
  const angleDeg = normalizeInfographicAngleDeg(value);

  const sensorHealth: SensorHealthStatus | undefined =
    health != null ? courseBindingHealthToSensorHealth(health) : undefined;
  const stale = sensorHealth === "stale";

  const shared = {
    label,
    value,
    unit,
    decimals,
    showLabel,
    showValue,
    showUnit,
    config,
    readoutConfig: layoutConfig,
  };

  return (
    <WidgetBoardTileShell
      {...pickWidgetBoardTileShellProps(layoutConfig)}
      stale={stale}
      className={`course-infographic-widget ${className ?? ""}`.trim()}
    >
      <div
        className="h-full min-h-0 w-full min-w-0"
        data-infographic-preset={preset}
        data-infographic-value-mode={valueMode}
      >
      {preset === "thermometer-mercury" ? (
        <InfographicThermometerMercurySkin {...shared} ratio={displayRatio} />
      ) : null}
      {preset === "battery-segmented" ? (
        <InfographicBatterySegmentedSkin {...shared} ratio={displayRatio} />
      ) : null}
      {preset === "droplet-fill" ? (
        <InfographicDropletFillSkin {...shared} ratio={displayRatio} />
      ) : null}
      {preset === "manometer-column" ? (
        <InfographicManometerColumnSkin {...shared} ratio={displayRatio} />
      ) : null}
      {preset === "compass-rose" ? (
        <InfographicCompassRoseSkin {...shared} angleDeg={angleDeg} />
      ) : null}
      {preset === "seven-segment" ? (
        <InfographicSevenSegmentSkin {...shared} />
      ) : null}
      </div>
    </WidgetBoardTileShell>
  );
}
