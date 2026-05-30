import type { Project4McuHttpPayload } from "../protocol/project4-mcu-http-payload";

export type Project4MoveDirection =
  | "W"
  | "S"
  | "A"
  | "D"
  | "WA"
  | "WD"
  | "SA"
  | "SD"
  | "STOP";

function normalizeMcuBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function joinMcuUrl(baseUrl: string, path: string): string {
  const base = normalizeMcuBaseUrl(baseUrl);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function project4BuildTelemetryUrl(settings: Project4McuHttpPayload): string {
  return joinMcuUrl(settings.mcuBaseUrl, settings.telemetryPath);
}

export function project4BuildMoveUrl(settings: Project4McuHttpPayload, dir: Project4MoveDirection): string {
  const url = new URL(joinMcuUrl(settings.mcuBaseUrl, settings.movePath));
  url.searchParams.set(settings.moveDirQueryKey, dir);
  return url.toString();
}

export function project4BuildSetSpeedUrl(settings: Project4McuHttpPayload, val: number): string {
  const clamped = Math.max(0, Math.min(255, Math.round(val)));
  const base = joinMcuUrl(settings.mcuBaseUrl, settings.setSpeedPath);
  if (!settings.setSpeedUseQuery) {
    return base;
  }
  const url = new URL(base);
  url.searchParams.set(settings.setSpeedValueQueryKey, String(clamped));
  return url.toString();
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(id);
  }
}

export async function project4FetchTelemetryJson(
  settings: Project4McuHttpPayload,
): Promise<unknown> {
  const url = project4BuildTelemetryUrl(settings);
  const res = await fetchWithTimeout(url, settings.httpRequestTimeoutMs);
  if (!res.ok) {
    throw new Error(`Telemetry HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as unknown;
}

export async function project4FetchMove(
  settings: Project4McuHttpPayload,
  dir: Project4MoveDirection,
): Promise<{ ok: boolean; status: number; statusText: string }> {
  const url = project4BuildMoveUrl(settings, dir);
  const res = await fetchWithTimeout(url, settings.httpRequestTimeoutMs);
  return { ok: res.ok, status: res.status, statusText: res.statusText };
}

export async function project4FetchSetSpeed(
  settings: Project4McuHttpPayload,
  val: number,
): Promise<{ ok: boolean; status: number; statusText: string }> {
  const url = project4BuildSetSpeedUrl(settings, val);
  const res = await fetchWithTimeout(url, settings.httpRequestTimeoutMs);
  return { ok: res.ok, status: res.status, statusText: res.statusText };
}
