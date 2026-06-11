import type { InfographicSkinConfig } from "../../infographicVisualPreset";
import type { WidgetBoardReadoutLayoutConfig } from "../../../widget-board/widgetBoardReadoutLayout";
import { formatInfographicValue } from "../../infographicGeometry";
import { InfographicReadoutPanel } from "../../InfographicReadoutPanel";

export function InfographicCompassRoseSkin({
  label,
  value,
  unit,
  decimals,
  angleDeg,
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
  angleDeg: number | null;
  showLabel: boolean;
  showValue: boolean;
  showUnit: boolean;
  config: InfographicSkinConfig;
  readoutConfig?: WidgetBoardReadoutLayoutConfig;
}) {
  const needle = angleDeg ?? 0;
  const needleColor = config.needleColor ?? "var(--course-wb-gradient-from, #38bdf8)";

  return (
    <div
      className="course-infographic-compass flex h-full min-h-0 w-full flex-col items-center gap-1 px-2 py-2"
      data-infographic-skin="compass-rose"
    >
      <InfographicReadoutPanel
        config={readoutConfig}
        showLabel={showLabel}
        showValue={config.showDigitalHeading === true && showValue}
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
      <div className="relative aspect-square h-full max-h-[72%] w-auto max-w-full">
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          {config.showCardinals ? (
            <>
              <text x="50" y="12" textAnchor="middle" fontSize="8" fill="var(--course-wb-label)" fontWeight="600">N</text>
              <text x="90" y="53" textAnchor="middle" fontSize="7" fill="var(--course-wb-label)">E</text>
              <text x="50" y="94" textAnchor="middle" fontSize="7" fill="var(--course-wb-label)">S</text>
              <text x="10" y="53" textAnchor="middle" fontSize="7" fill="var(--course-wb-label)">W</text>
            </>
          ) : null}
          <g transform={`rotate(${needle} 50 50)`}>
            <polygon points="50,18 54,50 50,44 46,50" fill={needleColor} />
            <polygon points="50,82 54,50 50,56 46,50" fill="rgba(255,255,255,0.25)" />
          </g>
          <circle cx="50" cy="50" r="4" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.2)" />
        </svg>
      </div>
    </div>
  );
}
