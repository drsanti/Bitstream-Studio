/**
 * Fixed-width classes for socket-row live values so digits do not shift on tick.
 * Typography matches {@link FlowNodeSocketRow} port labels (sans, 11px); widths match worst-case signed strings.
 */

/** Same typography as socket port labels — Inter via Tailwind `font-sans`. */
export const SOCKET_LIVE_VALUE_TYPOGRAPHY =
  "font-sans text-[11px] leading-tight";

/** Signed 3 dp in ±1 (quaternion / euler): `+1.000`, `-0.999`. */
export const SOCKET_LIVE_CELL_SIGNED3_UNIT =
  "inline-block w-[6ch] shrink-0 text-right";

/** Signed 2 dp (accel / gyro): `+99.99`, `-99.99`. */
export const SOCKET_LIVE_CELL_SIGNED2 = "inline-block w-[6ch] shrink-0 text-right";

export type SocketLiveValueTextAlign = "left" | "right";

export function socketLiveValueCellClass(
  fractionDigits: number,
  textAlign: SocketLiveValueTextAlign = "right",
): string {
  const base = fractionDigits >= 3 ? SOCKET_LIVE_CELL_SIGNED3_UNIT : SOCKET_LIVE_CELL_SIGNED2;
  return textAlign === "left" ? base.replace("text-right", "text-left") : base;
}
