import type { InfographicSkinConfig } from "../../infographicVisualPreset";
import { sevenSegmentCharsForValue } from "./sevenSegmentGlyphs";
import { InfographicSevenSegmentDigit } from "./InfographicSevenSegmentDigit";

export function InfographicSevenSegmentSkin({
  label,
  value,
  unit,
  decimals,
  showLabel,
  showValue,
  showUnit,
  config,
}: {
  label: string;
  value: number | null;
  unit?: string;
  decimals: number;
  showLabel: boolean;
  showValue: boolean;
  showUnit: boolean;
  config: InfographicSkinConfig;
}) {
  const chars = sevenSegmentCharsForValue(value, decimals);
  const onColor = config.fillColor ?? "var(--course-wb-gradient-from, #f97316)";
  const offColor = config.trackColor ?? "rgba(255,255,255,0.08)";

  return (
    <div
      className="course-infographic-seven-segment flex h-full min-h-0 w-full flex-col items-center justify-center gap-1.5 px-2 py-2"
      data-infographic-skin="seven-segment"
    >
      {showLabel ? (
        <p className="w-full truncate text-center text-[10px] font-medium uppercase tracking-widest text-[var(--course-wb-label)]">
          {label}
        </p>
      ) : null}
      {showValue ? (
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
      ) : null}
      {showUnit && unit ? (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--course-wb-unit)]">
          {unit}
        </p>
      ) : null}
    </div>
  );
}
