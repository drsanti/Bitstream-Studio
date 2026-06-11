import type { InfographicSkinConfig } from "../../infographicVisualPreset";
import type { WidgetBoardReadoutLayoutConfig } from "../../../widget-board/widgetBoardReadoutLayout";
import { sevenSegmentCharsForValue } from "./sevenSegmentGlyphs";
import { InfographicSevenSegmentDigit } from "./InfographicSevenSegmentDigit";
import { InfographicReadoutPanel } from "../../InfographicReadoutPanel";

export function InfographicSevenSegmentSkin({
  label,
  value,
  decimals,
  showLabel,
  showValue,
  config,
  readoutConfig = {},
}: {
  label: string;
  value: number | null;
  decimals: number;
  showLabel: boolean;
  showValue: boolean;
  config: InfographicSkinConfig;
  readoutConfig?: WidgetBoardReadoutLayoutConfig;
}) {
  const chars = sevenSegmentCharsForValue(value, decimals);
  const onColor = config.fillColor ?? "var(--course-wb-gradient-from, #f97316)";
  const offColor = config.trackColor ?? "rgba(255,255,255,0.08)";

  const digitRow = (
    <div className="flex h-10 items-stretch gap-0.5 sm:h-12">
      {chars.map((char, index) => (
        <InfographicSevenSegmentDigit
          key={`${char}-${index}`}
          char={char}
          onColor={onColor}
          offColor={offColor}
        />
      ))}
    </div>
  );

  return (
    <div
      className="course-infographic-seven-segment flex h-full min-h-0 w-full flex-col items-center justify-center gap-1.5 px-2 py-2"
      data-infographic-skin="seven-segment"
    >
      <InfographicReadoutPanel
        config={readoutConfig}
        showLabel={showLabel}
        showValue={showValue}
        label={label}
        value={digitRow}
        stackClassName="w-full"
      />
    </div>
  );
}
