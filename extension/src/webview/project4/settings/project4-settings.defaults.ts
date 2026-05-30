import { classifyMcuConnectionPreset } from "../lib/mcu-connection-presets";
import {
  PROJECT4_DOCUMENTED_MCU_SCANNER_SWEEP_MAX_DEG,
  PROJECT4_DOCUMENTED_MCU_SCANNER_SWEEP_MIN_DEG,
} from "../lib/project4-mcu-documented-ranges";
import { PROJECT4_ROBOT_ONLINE_PLACEHOLDER } from "../lib/project4-robot-asset-constants";
import { PROJECT4_TWIN_CUBEMAP_NONE } from "../lib/project4-twin-environments";
import type { Project4SettingsState } from "./project4-settings.types";

export const PROJECT4_SETTINGS_STORAGE_KEY = "ternion.project4.settings.v1";

const DEFAULT_MCU_BASE_URL = "http://192.168.4.1";

export const PROJECT4_SETTINGS_DEFAULTS: Project4SettingsState = {
  schemaVersion: 1,
  mcuBaseUrl: DEFAULT_MCU_BASE_URL,
  mcuConnectionPreset: classifyMcuConnectionPreset(DEFAULT_MCU_BASE_URL),
  telemetryPath: "/data",
  movePath: "/move",
  setSpeedPath: "/setSpeed",
  moveDirQueryKey: "dir",
  setSpeedValueQueryKey: "val",
  telemetryPollIntervalMs: 100,
  httpRequestTimeoutMs: 3000,
  trackWidthM: 0.04,
  wheelbaseM: 0.23,
  wheelRadiusM: 0.07,
  scannerFrontAzimuthMinDeg: -45,
  scannerFrontAzimuthMaxDeg: 45,
  scannerRearAzimuthMinDeg: -45,
  scannerRearAzimuthMaxDeg: 45,
  scannerTelemetrySweepMinDeg: PROJECT4_DOCUMENTED_MCU_SCANNER_SWEEP_MIN_DEG,
  scannerTelemetrySweepMaxDeg: PROJECT4_DOCUMENTED_MCU_SCANNER_SWEEP_MAX_DEG,
  reverseSafetyStopCmDisplay: 10,
  robotModelUrl: PROJECT4_ROBOT_ONLINE_PLACEHOLDER,
  twinCubemapEnvironmentId: PROJECT4_TWIN_CUBEMAP_NONE,
  setSpeedUseQuery: true,
};
