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

import { useEffect, useRef, useState } from "react";
import { Check, Orbit, Settings2 } from "lucide-react";
import { TRNMenuPanel, TRNMenuSectionTitle } from "@/ui/TRN";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";

const MENU_ITEM_ROW_CLASS =
  "flex w-full shrink-0 items-start justify-start gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-left text-sm font-normal text-zinc-100 shadow-none transition-colors hover:border-white/20 hover:bg-white/12";

/** Settings2 menu for BMI270 fusion quaternion display options. */
export function Bmi270FusionQuaternionDisplaySettingsMenu()
{
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const showNorm = useBitstreamConfigStore((s) => s.bmi270FusionQuatShowNorm);
  const preferPositiveW = useBitstreamConfigStore((s) => s.bmi270FusionQuatPreferPositiveW);
  const setShowNorm = useBitstreamConfigStore((s) => s.setBmi270FusionQuatShowNorm);
  const setPreferPositiveW = useBitstreamConfigStore((s) => s.setBmi270FusionQuatPreferPositiveW);

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
        aria-label="BMI270 quaternion display options"
        title="BMI270 quaternion display options"
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
                aria-checked={showNorm}
                className={MENU_ITEM_ROW_CLASS}
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
                className={MENU_ITEM_ROW_CLASS}
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
          </TRNMenuPanel>
        </div>
      ) : null}
    </div>
  );
}
