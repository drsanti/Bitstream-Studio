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

import type { ReactNode } from "react";
import { Check, Thermometer, Hash } from "lucide-react";
import { TRNMenuSectionTitle } from "@/ui/TRN";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import {
  TEMPERATURE_UNIT_LABELS,
  type TemperatureDisplayUnit,
  type TemperatureDisplayFractionDigits,
} from "../../telemetry/temperatureDisplay.js";
import {
  TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS,
  TelemetryCardSettingsMenuShell,
} from "./TelemetryCardSettingsMenuShell.js";

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
  {
    id: 0,
    label: "0 decimals",
    icon: <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: 1,
    label: "1 decimal",
    icon: <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: 2,
    label: "2 decimals",
    icon: <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
];

function MenuItem(props: {
  label: string;
  icon: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const { label, icon, selected, onSelect } = props;
  return (
    <button
      type="button"
      role="menuitem"
      className={TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS}
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
export function TemperatureDisplaySettingsMenu() {
  const unit = useBitstreamConfigStore((s) => s.temperatureDisplayUnit);
  const digits = useBitstreamConfigStore((s) => s.temperatureDisplayFractionDigits);
  const setUnit = useBitstreamConfigStore((s) => s.setTemperatureDisplayUnit);
  const setDigits = useBitstreamConfigStore((s) => s.setTemperatureDisplayFractionDigits);

  return (
    <TelemetryCardSettingsMenuShell ariaLabel="Temperature display options">
      {({ close }) => (
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
                close();
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
                close();
              }}
            />
          ))}
        </div>
      )}
    </TelemetryCardSettingsMenuShell>
  );
}
