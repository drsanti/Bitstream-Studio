/**
 * Fixed-width classes for socket-row live values so digits do not shift on tick.
 * Widths match worst-case signed strings at 10px tabular mono.
 */

/** Signed 3 dp in ±1 (quaternion / euler): `+1.000`, `-0.999`. */
export const SOCKET_LIVE_CELL_SIGNED3_UNIT =
  "inline-block w-[6ch] shrink-0 text-right";

/** Signed 2 dp (accel / gyro): `+99.99`, `-99.99`. */
export const SOCKET_LIVE_CELL_SIGNED2 = "inline-block w-[6ch] shrink-0 text-right";

export function socketLiveValueCellClass(fractionDigits: number): string {
  return fractionDigits >= 3 ? SOCKET_LIVE_CELL_SIGNED3_UNIT : SOCKET_LIVE_CELL_SIGNED2;
}
