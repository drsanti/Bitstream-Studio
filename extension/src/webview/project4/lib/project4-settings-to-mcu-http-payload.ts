import type { Project4McuHttpPayload } from "../../../ai/protocol/project4-mcu-http-payload";
import type { Project4SettingsState } from "../settings/project4-settings.types";

/** Fields required to build **`project4McuHttp`** — avoids subscribing the Assistant panel to unrelated settings. */
export type Project4McuHttpSettingsSlice = Pick<
  Project4SettingsState,
  | "mcuBaseUrl"
  | "telemetryPath"
  | "movePath"
  | "setSpeedPath"
  | "moveDirQueryKey"
  | "setSpeedValueQueryKey"
  | "httpRequestTimeoutMs"
  | "setSpeedUseQuery"
>;

/** Maps persisted Connection fields to the **`ai/request.project4McuHttp`** shape expected by the AI bridge. */
export function project4SettingsToMcuHttpPayload(state: Project4McuHttpSettingsSlice): Project4McuHttpPayload {
  return {
    mcuBaseUrl: state.mcuBaseUrl.trim(),
    telemetryPath: state.telemetryPath,
    movePath: state.movePath,
    setSpeedPath: state.setSpeedPath,
    moveDirQueryKey: state.moveDirQueryKey,
    setSpeedValueQueryKey: state.setSpeedValueQueryKey,
    httpRequestTimeoutMs: state.httpRequestTimeoutMs,
    setSpeedUseQuery: state.setSpeedUseQuery,
  };
}
