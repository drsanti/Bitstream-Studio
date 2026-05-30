/*******************************************************************************
 * File Name : TemperatureDisplaySettingsMenu.tsx
 *
 * Description : Gear menu for global temperature display (unit + decimals) used
 *               by all temperature telemetry cards.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Settings2, Thermometer, Hash } from "lucide-react";
import { TRNMenuPanel, TRNMenuSectionTitle } from "@/ui/TRN";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import { TEMPERATURE_UNIT_LABELS, type TemperatureDisplayUnit, type TemperatureDisplayFractionDigits } from "../../telemetry/temperatureDisplay.js";

const MENU_ITEM_ROW_CLASS =
  "flex w-full shrink-0 items-start justify-start gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-left text-sm font-normal text-zinc-100 shadow-none transition-colors hover:border-white/20 hover:bg-white/12";

type MenuOption<T extends string | number> = {
  id: T;
  label: string;
  icon: ReactNode;
};

const UNIT_OPTIONS: MenuOption<TemperatureDisplayUnit>[] = [
  {
    id: "c",
    label: TEMPERATURE_UNIT_LABELS.c,
    icon: <Thermometer className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "f",
    label: TEMPERATURE_UNIT_LABELS.f,
    icon: <Thermometer className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "k",
    label: TEMPERATURE_UNIT_LABELS.k,
    icon: <Thermometer className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
];

const DIGITS_OPTIONS: MenuOption<TemperatureDisplayFractionDigits>[] = [
  { id: 0, label: "0 decimals", icon: <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden /> },
  { id: 1, label: "1 decimal", icon: <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden /> },
  { id: 2, label: "2 decimals", icon: <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden /> },
];

function MenuItem<T extends string | number>(props: {
  label: string;
  icon: ReactNode;
  selected: boolean;
  onSelect: () => void;
})
{
  const { label, icon, selected, onSelect } = props;
  return (
    <button
      type="button"
      role="menuitem"
      className={MENU_ITEM_ROW_CLASS}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onSelect}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate leading-snug">{label}</span>
      </span>
      {selected ? (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
      ) : (
        <span className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
    </button>
  );
}

/** Small Settings2 menu used on each Temperature card header. */
export function TemperatureDisplaySettingsMenu()
{
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const unit = useBitstreamConfigStore((s) => s.temperatureDisplayUnit);
  const digits = useBitstreamConfigStore((s) => s.temperatureDisplayFractionDigits);
  const setUnit = useBitstreamConfigStore((s) => s.setTemperatureDisplayUnit);
  const setDigits = useBitstreamConfigStore((s) => s.setTemperatureDisplayFractionDigits);

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
        aria-label="Temperature display options"
        title="Temperature display options"
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
                <MenuItem
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={unit === opt.id}
                  onSelect={() => {
                    setUnit(opt.id);
                    setOpen(false);
                  }}
                />
              ))}

              <TRNMenuSectionTitle spacing="menuNext">Precision</TRNMenuSectionTitle>
              {DIGITS_OPTIONS.map((opt) => (
                <MenuItem
                  key={String(opt.id)}
                  label={opt.label}
                  icon={opt.icon}
                  selected={digits === opt.id}
                  onSelect={() => {
                    setDigits(opt.id);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          </TRNMenuPanel>
        </div>
      ) : null}
    </div>
  );
}

