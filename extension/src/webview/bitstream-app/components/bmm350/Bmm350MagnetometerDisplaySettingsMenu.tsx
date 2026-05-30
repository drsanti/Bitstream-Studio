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

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Compass, Gauge, Settings2 } from "lucide-react";
import { TRNMenuPanel, TRNMenuSectionTitle } from "@/ui/TRN";
import {
  BMM350_MAG_GAUGE_RANGE_LABELS,
  type Bmm350MagGaugeRange,
} from "../../telemetry/magnetometerDisplay.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";

const MENU_ITEM_ROW_CLASS =
  "flex w-full shrink-0 items-start justify-start gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-left text-sm font-normal text-zinc-100 shadow-none transition-colors hover:border-white/20 hover:bg-white/12";

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
export function Bmm350MagnetometerDisplaySettingsMenu()
{
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const showMagnitude = useBitstreamConfigStore((s) => s.bmm350MagShowMagnitude);
  const gaugeRange = useBitstreamConfigStore((s) => s.bmm350MagGaugeRange);
  const setShowMagnitude = useBitstreamConfigStore((s) => s.setBmm350MagShowMagnitude);
  const setGaugeRange = useBitstreamConfigStore((s) => s.setBmm350MagGaugeRange);

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
        aria-label="BMM350 magnetometer display options"
        title="BMM350 magnetometer display options"
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
              <TRNMenuSectionTitle spacing="menuFirst">Show</TRNMenuSectionTitle>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={showMagnitude}
                className={MENU_ITEM_ROW_CLASS}
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
          </TRNMenuPanel>
        </div>
      ) : null}
    </div>
  );
}
