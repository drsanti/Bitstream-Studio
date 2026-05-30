/*******************************************************************************
 * File Name : portAdminFormat.ts
 *
 * Description : Format helpers for Serial Port Admin status strip.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { HandshakeLifecycleState } from "../state/bitstreamLive.store.js";

/** Relative "last refresh" label for the status strip. */
export function formatPortAdminRefreshAge(lastUpdatedAtMs: number | null, nowMs = Date.now()): string
{
  if (lastUpdatedAtMs == null)
  {
    return "not refreshed";
  }
  const deltaSec = Math.max(0, Math.floor((nowMs - lastUpdatedAtMs) / 1000));
  if (deltaSec < 5)
  {
    return "just now";
  }
  if (deltaSec < 60)
  {
    return `${deltaSec}s ago`;
  }
  const deltaMin = Math.floor(deltaSec / 60);
  return `${deltaMin}m ago`;
}

/** User-facing handshake chip label. */
export function formatPortAdminHandshakeLabel(state: HandshakeLifecycleState): string
{
  switch (state)
  {
    case "passed":
      return "passed";
    case "running":
      return "running";
    case "failed":
      return "failed";
    case "unknown":
    default:
      return "—";
  }
}
