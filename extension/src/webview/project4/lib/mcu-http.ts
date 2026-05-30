import type { Project4SettingsState } from "../settings/project4-settings.types";
import {
  parseProject4TelemetryJson,
  type Project4TelemetrySnapshot,
} from "./project4-telemetry-types";

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

/** Strip trailing slashes from base URL (no path segment). */
export function normalizeMcuBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

export function joinMcuUrl(baseUrl: string, path: string): string {
  const base = normalizeMcuBaseUrl(baseUrl);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function buildTelemetryUrl(settings: Project4SettingsState): string {
  return joinMcuUrl(settings.mcuBaseUrl, settings.telemetryPath);
}

export function buildMoveUrl(settings: Project4SettingsState, dir: Project4MoveDirection): string {
  const url = new URL(joinMcuUrl(settings.mcuBaseUrl, settings.movePath));
  url.searchParams.set(settings.moveDirQueryKey, dir);
  return url.toString();
}

export function buildSetSpeedUrl(settings: Project4SettingsState, val: number): string {
  const clamped = Math.max(0, Math.min(255, Math.round(val)));
  const base = joinMcuUrl(settings.mcuBaseUrl, settings.setSpeedPath);
  if (!settings.setSpeedUseQuery) {
    return base;
  }
  const url = new URL(base);
  url.searchParams.set(settings.setSpeedValueQueryKey, String(clamped));
  return url.toString();
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init?: RequestInit,
): Promise<Response> {
  const ctrl = new AbortController();
  const id = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
    });
  } finally {
    window.clearTimeout(id);
  }
}

export async function fetchProject4Telemetry(
  settings: Project4SettingsState,
): Promise<Project4TelemetrySnapshot> {
  const url = buildTelemetryUrl(settings);
  const res = await fetchWithTimeout(url, settings.httpRequestTimeoutMs, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const json: unknown = await res.json();
  const parsed = parseProject4TelemetryJson(json);
  if (!parsed) {
    throw new Error("Telemetry JSON shape not recognized");
  }
  return parsed;
}

export async function sendProject4Move(
  settings: Project4SettingsState,
  dir: Project4MoveDirection,
): Promise<Response> {
  const url = buildMoveUrl(settings, dir);
  return fetchWithTimeout(url, settings.httpRequestTimeoutMs, {
    method: "GET",
    cache: "no-store",
  });
}

export async function sendProject4SetSpeed(
  settings: Project4SettingsState,
  val: number,
): Promise<Response> {
  const url = buildSetSpeedUrl(settings, val);
  return fetchWithTimeout(url, settings.httpRequestTimeoutMs, {
    method: "GET",
    cache: "no-store",
  });
}
