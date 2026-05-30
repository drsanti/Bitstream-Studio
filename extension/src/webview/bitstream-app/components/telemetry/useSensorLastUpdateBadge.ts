/*******************************************************************************
 * File Name : useSensorLastUpdateBadge.ts
 *
 * Description : Live-store props for LastUpdateBadge (host lastAt + device/host Δt).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.1
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { BitstreamSensorSourceHint } from "../../../../bitstream/events/sensor-decoder.js";
import { useBitstreamLiveStore } from "../../state/bitstreamLive.store.js";

export function useSensorLastUpdateBadge(
  hint: BitstreamSensorSourceHint,
  expectedIntervalMs: number,
): {
  lastAtMs: number;
  interArrivalMs: number | null;
  hostInterArrivalMs: number | null;
  expectedIntervalMs: number;
} | null {
  const lastAtMs = useBitstreamLiveStore((s) => s.lastAtByHint[hint]);
  const interArrivalMs = useBitstreamLiveStore((s) => s.lastDeltaMsByHint[hint]);
  const hostInterArrivalMs = useBitstreamLiveStore((s) => s.lastHostInterArrivalMsByHint[hint]);

  if (lastAtMs == null)
  {
    return null;
  }

  return {
    lastAtMs,
    interArrivalMs,
    hostInterArrivalMs,
    expectedIntervalMs,
  };
}
