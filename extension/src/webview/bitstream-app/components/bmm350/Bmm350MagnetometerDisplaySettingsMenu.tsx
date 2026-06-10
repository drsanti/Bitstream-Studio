/*******************************************************************************
 * File Name : Bmm350MagnetometerDisplaySettingsMenu.tsx
 *
 * Description : Gear menu on BMM350 Magnetometer card — |B| row and gauge range.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { ReactNode } from "react";
import { Check, Compass, Gauge } from "lucide-react";
import { TRNMenuSectionTitle } from "@/ui/TRN";
import {
  BMM350_MAG_GAUGE_RANGE_LABELS,
  type Bmm350MagGaugeRange,
} from "../../telemetry/magnetometerDisplay.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import {
  TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS,
  TelemetryCardSettingsMenuShell,
} from "../telemetry/TelemetryCardSettingsMenuShell.js";

const GAUGE_RANGE_OPTIONS: { id: Bmm350MagGaugeRange; icon: ReactNode }[] = [
  {
    id: "earth",
    icon: <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "wide",
    icon: <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "auto",
    icon: <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
];

/** Settings2 menu for BMM350 Magnetometer display options. */
export function Bmm350MagnetometerDisplaySettingsMenu() {
  const showMagnitude = useBitstreamConfigStore((s) => s.bmm350MagShowMagnitude);
  const gaugeRange = useBitstreamConfigStore((s) => s.bmm350MagGaugeRange);
  const setShowMagnitude = useBitstreamConfigStore((s) => s.setBmm350MagShowMagnitude);
  const setGaugeRange = useBitstreamConfigStore((s) => s.setBmm350MagGaugeRange);

  return (
    <TelemetryCardSettingsMenuShell ariaLabel="BMM350 magnetometer display options">
      {({ close }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <TRNMenuSectionTitle spacing="menuFirst">Show</TRNMenuSectionTitle>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={showMagnitude}
            className={TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowMagnitude(!showMagnitude)}
          >
            <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate leading-snug">Magnitude |B|</span>
            </span>
            {showMagnitude ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
            ) : (
              <span className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
          </button>

          <TRNMenuSectionTitle spacing="menuNext">Gauge range</TRNMenuSectionTitle>
          {GAUGE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="menuitemradio"
              aria-checked={gaugeRange === opt.id}
              className={TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                setGaugeRange(opt.id);
                close();
              }}
            >
              {opt.icon}
              <span className="min-w-0 flex-1">
                <span className="block truncate leading-snug">
                  {BMM350_MAG_GAUGE_RANGE_LABELS[opt.id]}
                </span>
              </span>
              {gaugeRange === opt.id ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
              ) : (
                <span className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
            </button>
          ))}
        </div>
      )}
    </TelemetryCardSettingsMenuShell>
  );
}
