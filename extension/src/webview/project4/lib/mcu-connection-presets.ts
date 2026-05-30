import {
  composeMcuConnection,
  parseMcuConnection,
  type ParsedMcuConnection,
} from "./mcu-connection-url";

/** Matches **`mock-mcu-server.ts`** defaults (`MOCK_MCU_HOST` / `MOCK_MCU_PORT`). */
export const MOCK_MCU_DEFAULT_HOST = "127.0.0.1";
export const MOCK_MCU_DEFAULT_PORT = "8787";

/** Typical ESP AP-style fixed address from PROJECT_INFO.md (default HTTP port). */
export const REAL_MCU_DEFAULT_HOST = "192.168.4.1";

export const MCU_CONNECTION_PRESET_MOCK: ParsedMcuConnection = {
  scheme: "http",
  host: MOCK_MCU_DEFAULT_HOST,
  port: MOCK_MCU_DEFAULT_PORT,
};

export const MCU_CONNECTION_PRESET_REAL: ParsedMcuConnection = {
  scheme: "http",
  host: REAL_MCU_DEFAULT_HOST,
  port: "",
};

export function mcuBaseUrlFromPreset(preset: ParsedMcuConnection): string {
  return composeMcuConnection(preset);
}

export function mcuConnectionMatchesPreset(
  current: ParsedMcuConnection,
  preset: ParsedMcuConnection,
): boolean {
  return (
    current.scheme === preset.scheme &&
    current.host.trim() === preset.host.trim() &&
    current.port.trim() === preset.port.trim()
  );
}

/** True when current URL matches mock or real preset (helps badge logic after manual edits). */
export function classifyMcuConnectionPreset(mcuBaseUrl: string): "mock" | "real" | "custom" {
  const p = parseMcuConnection(mcuBaseUrl);
  if (mcuConnectionMatchesPreset(p, MCU_CONNECTION_PRESET_MOCK)) {
    return "mock";
  }
  if (mcuConnectionMatchesPreset(p, MCU_CONNECTION_PRESET_REAL)) {
    return "real";
  }
  return "custom";
}
