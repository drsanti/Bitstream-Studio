/*******************************************************************************
 * File Name : Dps368PressureDisplaySettingsMenu.tsx
 *
 * Description : Gear menu on DPS368 Pressure card — unit, precision, gauge range.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Check, Gauge, Hash } from "lucide-react";
import type { ReactNode } from "react";
import { TRNMenuSectionTitle } from "@/ui/TRN";
import {
  PRESSURE_GAUGE_RANGE_LABELS,
  PRESSURE_UNIT_LABELS,
  type PressureDisplayFractionDigits,
  type PressureDisplayUnit,
  type PressureGaugeRange,
} from "../../telemetry/pressureDisplay.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import {
  TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS,
  TelemetryCardSettingsMenuShell,
} from "../telemetry/TelemetryCardSettingsMenuShell.js";

const UNIT_OPTIONS: { id: PressureDisplayUnit; icon: ReactNode }[] = [
  {
    id: "hpa",
    icon: <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "kpa",
    icon: <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "pa",
    icon: <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
];

const DIGITS_OPTIONS: { id: PressureDisplayFractionDigits; label: string }[] = [
  { id: 0, label: "0 decimals" },
  { id: 1, label: "1 decimal" },
  { id: 2, label: "2 decimals" },
];

const GAUGE_OPTIONS: { id: PressureGaugeRange; icon: ReactNode }[] = [
  {
    id: "sea-level",
    icon: <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "full",
    icon: <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "auto",
    icon: <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
];

/** Settings2 menu for DPS368 pressure telemetry display. */
export function Dps368PressureDisplaySettingsMenu() {
  const unit = useBitstreamConfigStore((s) => s.dps368PressureDisplayUnit);
  const digits = useBitstreamConfigStore((s) => s.dps368PressureDisplayFractionDigits);
  const gaugeRange = useBitstreamConfigStore((s) => s.dps368PressureGaugeRange);
  const setUnit = useBitstreamConfigStore((s) => s.setDps368PressureDisplayUnit);
  const setDigits = useBitstreamConfigStore((s) => s.setDps368PressureDisplayFractionDigits);
  const setGaugeRange = useBitstreamConfigStore((s) => s.setDps368PressureGaugeRange);

  return (
    <TelemetryCardSettingsMenuShell ariaLabel="DPS368 pressure display options">
      {({ close }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <TRNMenuSectionTitle spacing="menuFirst">Unit</TRNMenuSectionTitle>
          {UNIT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="menuitemradio"
              aria-checked={unit === opt.id}
              className={TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                setUnit(opt.id);
                close();
              }}
            >
              {opt.icon}
              <span className="min-w-0 flex-1">
                <span className="block truncate leading-snug">
                  {PRESSURE_UNIT_LABELS[opt.id]}
                </span>
              </span>
              {unit === opt.id ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
              ) : (
                <span className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
            </button>
          ))}

          <TRNMenuSectionTitle spacing="menuNext">Precision</TRNMenuSectionTitle>
          {DIGITS_OPTIONS.map((opt) => (
            <button
              key={String(opt.id)}
              type="button"
              role="menuitemradio"
              aria-checked={digits === opt.id}
              className={TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                setDigits(opt.id);
                close();
              }}
            >
              <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate leading-snug">{opt.label}</span>
              </span>
              {digits === opt.id ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
              ) : (
                <span className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
            </button>
          ))}

          <TRNMenuSectionTitle spacing="menuNext">Gauge range</TRNMenuSectionTitle>
          {GAUGE_OPTIONS.map((opt) => (
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
                  {PRESSURE_GAUGE_RANGE_LABELS[opt.id]}
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
