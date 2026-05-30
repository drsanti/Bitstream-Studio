/*******************************************************************************
 * File Name : formatActivityTime.ts
 *
 * Description : Local time formatter for telemetry activity log rows.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

/** Format wall-clock time with milliseconds for activity rows. */
export function formatActivityTime(atMs: number): string {
  const d = new Date(atMs);
  return `${d.toLocaleTimeString(undefined, { hour12: false })}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}
