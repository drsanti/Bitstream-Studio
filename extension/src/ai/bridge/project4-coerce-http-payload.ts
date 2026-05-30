import type { Project4McuHttpPayload } from "../protocol/project4-mcu-http-payload";

/** Validates optional **`project4McuHttp`** from **`ai/request`** JSON and fills MCU-shaped defaults. */
export function coerceProject4McuHttpPayload(raw: unknown): Project4McuHttpPayload | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const o = raw as Record<string, unknown>;
  const mcuBaseUrl = typeof o.mcuBaseUrl === "string" ? o.mcuBaseUrl.trim() : "";
  if (!mcuBaseUrl) {
    return undefined;
  }

  const str = (key: string, fallback: string): string => {
    const v = o[key];
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;
  };

  let timeout = Number(o.httpRequestTimeoutMs);
  if (!Number.isFinite(timeout)) {
    timeout = 3000;
  }
  const httpRequestTimeoutMs = Math.min(30_000, Math.max(500, timeout));

  return {
    mcuBaseUrl,
    telemetryPath: str("telemetryPath", "/data"),
    movePath: str("movePath", "/move"),
    setSpeedPath: str("setSpeedPath", "/setSpeed"),
    moveDirQueryKey: str("moveDirQueryKey", "dir"),
    setSpeedValueQueryKey: str("setSpeedValueQueryKey", "val"),
    httpRequestTimeoutMs,
    setSpeedUseQuery: o.setSpeedUseQuery !== false,
  };
}
