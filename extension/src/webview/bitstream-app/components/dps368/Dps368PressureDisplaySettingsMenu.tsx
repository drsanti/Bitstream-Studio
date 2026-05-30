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

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Gauge, Hash, Settings2 } from "lucide-react";
import { TRNMenuPanel, TRNMenuSectionTitle } from "@/ui/TRN";
import {
  PRESSURE_GAUGE_RANGE_LABELS,
  PRESSURE_UNIT_LABELS,
  type PressureDisplayFractionDigits,
  type PressureDisplayUnit,
  type PressureGaugeRange,
} from "../../telemetry/pressureDisplay.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";

const MENU_ITEM_ROW_CLASS =
  "flex w-full shrink-0 items-start justify-start gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-left text-sm font-normal text-zinc-100 shadow-none transition-colors hover:border-white/20 hover:bg-white/12";

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
export function Dps368PressureDisplaySettingsMenu()
{
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const unit = useBitstreamConfigStore((s) => s.dps368PressureDisplayUnit);
  const digits = useBitstreamConfigStore((s) => s.dps368PressureDisplayFractionDigits);
  const gaugeRange = useBitstreamConfigStore((s) => s.dps368PressureGaugeRange);
  const setUnit = useBitstreamConfigStore((s) => s.setDps368PressureDisplayUnit);
  const setDigits = useBitstreamConfigStore((s) => s.setDps368PressureDisplayFractionDigits);
  const setGaugeRange = useBitstreamConfigStore((s) => s.setDps368PressureGaugeRange);

  useEffect(() => {
    if (!open)
    {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const el = menuRef.current;
      if (el != null && !el.contains(e.target as Node))
      {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  return (
    <div ref={menuRef} className="relative flex shrink-0 items-center">
      <button
        type="button"
        aria-label="DPS368 pressure display options"
        title="DPS368 pressure display options"
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm p-0 text-zinc-400 transition-colors hover:text-zinc-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
      >
        <Settings2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      </button>
      {open ? (
        <div className="absolute top-[calc(100%+6px)] right-0 z-50 w-[min(19rem,calc(100vw-1rem))] overflow-visible">
          <TRNMenuPanel tone="glass-dropdown" className="py-1">
            <div className="flex min-w-0 flex-col gap-0.5">
              <TRNMenuSectionTitle spacing="menuFirst">Unit</TRNMenuSectionTitle>
              {UNIT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={unit === opt.id}
                  className={MENU_ITEM_ROW_CLASS}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    setUnit(opt.id);
                    setOpen(false);
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
                  className={MENU_ITEM_ROW_CLASS}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    setDigits(opt.id);
                    setOpen(false);
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
                  className={MENU_ITEM_ROW_CLASS}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    setGaugeRange(opt.id);
                    setOpen(false);
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
          </TRNMenuPanel>
        </div>
      ) : null}
    </div>
  );
}
