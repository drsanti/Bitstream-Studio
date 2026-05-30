/*******************************************************************************
 * File Name : formatPayload.ts
 *
 * Description : Safe JSON preview and byte estimates for tap rows.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export function estimateJsonBytes(topic: string, payload: unknown): number {
  try
  {
    const topicBytes = new TextEncoder().encode(topic).length;
    const payloadBytes =
      payload !== undefined && payload !== null
        ? new TextEncoder().encode(JSON.stringify(payload)).length
        : 0;
    return topicBytes + payloadBytes;
  }
  catch
  {
    return 0;
  }
}

export function formatPayloadPreview(payload: unknown, maxLen = 240): string {
  if (payload === undefined || payload === null)
  {
    return "—";
  }
  try
  {
    const text = JSON.stringify(payload, null, 0);
    if (text.length <= maxLen)
    {
      return text;
    }
    return `${text.slice(0, maxLen)}…`;
  }
  catch
  {
    return String(payload);
  }
}

export function formatBinaryPreview(data: Uint8Array, maxBytes = 48): string {
  const n = Math.min(data.byteLength, maxBytes);
  const hex: string[] = [];
  for (let i = 0; i < n; i++)
  {
    hex.push((data[i] ?? 0).toString(16).padStart(2, "0"));
  }
  const suffix = data.byteLength > maxBytes ? ` … +${data.byteLength - maxBytes} B` : "";
  return `${data.byteLength} B: ${hex.join(" ")}${suffix}`;
}

export function formatTapTime(atMs: number): string {
  const d = new Date(atMs);
  return `${d.toLocaleTimeString(undefined, { hour12: false })}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}
