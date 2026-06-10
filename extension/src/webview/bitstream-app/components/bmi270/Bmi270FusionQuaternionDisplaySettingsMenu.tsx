/*******************************************************************************
 * File Name : Bmi270FusionQuaternionDisplaySettingsMenu.tsx
 *
 * Description : Gear menu on BMI270 Quaternion card — norm row and +w display.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Check, Orbit } from "lucide-react";
import { TRNMenuSectionTitle } from "@/ui/TRN";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import {
  TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS,
  TelemetryCardSettingsMenuShell,
} from "../telemetry/TelemetryCardSettingsMenuShell.js";

/** Settings2 menu for BMI270 fusion quaternion display options. */
export function Bmi270FusionQuaternionDisplaySettingsMenu() {
  const showNorm = useBitstreamConfigStore((s) => s.bmi270FusionQuatShowNorm);
  const preferPositiveW = useBitstreamConfigStore((s) => s.bmi270FusionQuatPreferPositiveW);
  const setShowNorm = useBitstreamConfigStore((s) => s.setBmi270FusionQuatShowNorm);
  const setPreferPositiveW = useBitstreamConfigStore((s) => s.setBmi270FusionQuatPreferPositiveW);

  return (
    <TelemetryCardSettingsMenuShell ariaLabel="BMI270 quaternion display options">
      <div className="flex min-w-0 flex-col gap-0.5">
        <TRNMenuSectionTitle spacing="menuFirst">Show</TRNMenuSectionTitle>
        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={showNorm}
          className={TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setShowNorm(!showNorm)}
        >
          <Orbit className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate leading-snug">‖q‖ (norm)</span>
          </span>
          {showNorm ? (
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
          ) : (
            <span className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
        </button>

        <TRNMenuSectionTitle spacing="menuNext">Display</TRNMenuSectionTitle>
        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={preferPositiveW}
          className={TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setPreferPositiveW(!preferPositiveW)}
        >
          <Orbit className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate leading-snug">Prefer +w hemisphere</span>
          </span>
          {preferPositiveW ? (
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
          ) : (
            <span className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
        </button>
      </div>
    </TelemetryCardSettingsMenuShell>
  );
}
