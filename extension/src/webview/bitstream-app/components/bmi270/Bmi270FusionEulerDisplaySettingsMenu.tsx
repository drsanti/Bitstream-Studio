/*******************************************************************************
 * File Name : Bmi270FusionEulerDisplaySettingsMenu.tsx
 *
 * Description : Gear menu on BMI270 Euler Angles card — angle display range/unit.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { ReactNode } from "react";
import { Check, Compass, RotateCw } from "lucide-react";
import { TRNMenuSectionTitle } from "@/ui/TRN";
import {
  FUSION_EULER_ANGLE_DISPLAY_MODE_LABELS,
  type FusionEulerAngleDisplayMode,
} from "../../telemetry/fusionEulerAngleDisplay.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import {
  TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS,
  TelemetryCardSettingsMenuShell,
} from "../telemetry/TelemetryCardSettingsMenuShell.js";

const DISPLAY_OPTIONS: {
  id: FusionEulerAngleDisplayMode;
  icon: ReactNode;
}[] = [
  {
    id: "signed-pi-rad",
    icon: <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "signed-deg",
    icon: <RotateCw className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "unsigned-deg",
    icon: <RotateCw className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
];

/** Settings2 menu for BMI270 Euler angle display mode (−π…+π, ±180°, 0…360°). */
export function Bmi270FusionEulerDisplaySettingsMenu() {
  const displayMode = useBitstreamConfigStore((s) => s.bmi270FusionEulerDisplayMode);
  const setDisplayMode = useBitstreamConfigStore((s) => s.setBmi270FusionEulerDisplayMode);

  return (
    <TelemetryCardSettingsMenuShell ariaLabel="BMI270 Euler angle display options">
      {({ close }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <TRNMenuSectionTitle spacing="menuFirst">Angle display</TRNMenuSectionTitle>
          {DISPLAY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="menuitem"
              className={TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                setDisplayMode(opt.id);
                close();
              }}
            >
              {opt.icon}
              <span className="min-w-0 flex-1">
                <span className="block truncate leading-snug">
                  {FUSION_EULER_ANGLE_DISPLAY_MODE_LABELS[opt.id]}
                </span>
              </span>
              {displayMode === opt.id ? (
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
