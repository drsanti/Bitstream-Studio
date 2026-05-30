/*******************************************************************************
 * File Name : VehicleDrivingKeysCard.tsx
 *
 * Description : Driving control key reference (T3D control-keys subset).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Keyboard } from "lucide-react";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
} from "../../../ui/TRN/index.js";

const DRIVING_KEYS: { label: string; keys: string[] }[] = [
  { label: "Forward", keys: ["W", "↑"] },
  { label: "Reverse", keys: ["S", "↓"] },
  { label: "Steer left", keys: ["A", "←"] },
  { label: "Steer right", keys: ["D", "→"] },
  { label: "Hand brake", keys: ["Space", "Z"] },
];

/**
 * Collapsible driving controls reference.
 */
export function VehicleDrivingKeysCard()
{
  return (
    <TRNAccordion type="single" collapsible defaultValue="keys">
      <TRNAccordionItem value="keys">
        <TRNAccordionTrigger className="text-xs">
          <span className="flex items-center gap-2">
            <Keyboard className="h-3.5 w-3.5 text-zinc-400" />
            Driving controls
          </span>
        </TRNAccordionTrigger>
        <TRNAccordionContent>
          <ul className="space-y-2">
            {DRIVING_KEYS.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-zinc-400">{row.label}</span>
                <span className="flex gap-1">
                  {row.keys.map((k) => (
                    <kbd
                      key={k}
                      className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-200"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </TRNAccordionContent>
      </TRNAccordionItem>
    </TRNAccordion>
  );
}
