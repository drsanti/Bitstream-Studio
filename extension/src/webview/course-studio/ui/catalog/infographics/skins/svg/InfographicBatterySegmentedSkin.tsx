import type { InfographicSkinConfig } from "../../infographicVisualPreset";
import type { WidgetBoardReadoutLayoutConfig } from "../../../widget-board/widgetBoardReadoutLayout";
import { formatInfographicValue } from "../../infographicGeometry";
import { InfographicReadoutPanel } from "../../InfographicReadoutPanel";

export function InfographicBatterySegmentedSkin({
  label,
  value,
  unit,
  decimals,
  ratio,
  showLabel,
  showValue,
  showUnit,
  config,
  readoutConfig = {},
}: {
  label: string;
  value: number | null;
  unit?: string;
  decimals: number;
  ratio: number;
  showLabel: boolean;
  showValue: boolean;
  showUnit: boolean;
  config: InfographicSkinConfig;
  readoutConfig?: WidgetBoardReadoutLayoutConfig;
}) {
  const segments = config.segmentCount;
  const fill = config.fillColor ?? "var(--course-wb-gradient-from, #4ade80)";
  const track = config.trackColor ?? "rgba(255,255,255,0.08)";
  const litCount = Math.round(ratio * segments);

  return (
    <div
      className="course-infographic-battery flex h-full min-h-0 w-full flex-col items-center gap-1.5 px-3 py-2"
      data-infographic-skin="battery-segmented"
    >
      <InfographicReadoutPanel
        config={readoutConfig}
        showLabel={showLabel}
        showValue={showValue}
        label={label}
        value={
          <>
            {formatInfographicValue(value, decimals)}
            {showUnit && unit ? (
              <span className="ml-1 text-[10px] font-semibold text-[var(--course-wb-unit)]">{unit}</span>
            ) : null}
          </>
        }
        stackClassName="w-full"
      />
      <div className="flex w-full max-w-[9rem] items-center gap-1">
        <div
          className="flex min-w-0 flex-1 gap-0.5 rounded-sm border border-white/15 p-1"
          style={{ backgroundColor: track }}
        >
          {Array.from({ length: segments }, (_, index) => (
            <span
              key={index}
              className="h-5 min-w-0 flex-1 rounded-[2px] transition-colors duration-200"
              style={{
                backgroundColor: index < litCount ? fill : "rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>
        <span
          className="h-3 w-1.5 shrink-0 rounded-r-sm"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          aria-hidden
        />
      </div>
    </div>
  );
}
