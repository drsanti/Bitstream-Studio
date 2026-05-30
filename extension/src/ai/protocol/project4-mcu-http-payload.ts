/**
 * MCU HTTP wiring forwarded from the webview on each **`ai/request`** when Claude should call Project 4 tools.
 * Matches **`Project4SettingsState`** fields used by **`mcu-http.ts`** (URLs only — no secrets).
 */
export type Project4McuHttpPayload = {
  mcuBaseUrl: string;
  telemetryPath: string;
  movePath: string;
  setSpeedPath: string;
  moveDirQueryKey: string;
  setSpeedValueQueryKey: string;
  httpRequestTimeoutMs: number;
  setSpeedUseQuery: boolean;
};
