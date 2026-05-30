import { create } from "zustand";
import {
  BITSTREAM_DEFAULT_BAUD_RATE_TEXT,
  normalizeBitstreamBaudRateText,
} from "../../../bitstream/bitstream-default-baud.js";
import { getBitstreamWsClientUrl } from "../../runtimeWsUrls";
import { clampSensorDecodeStaleIntervalMultiplier } from "../components/telemetry/sensorDecodeStaleWatchdog.js";
import {
  type SensorTelemetryIconPulseAnimationPreset,
  type SensorTelemetryIconPulseIntensityPreset,
  type SensorTelemetryTweenEase,
  clampInterpolationMinMaxPair,
  clampSensorTelemetryIconPulseThrottleMs,
  clampSensorTelemetryInterpolationMaxMs,
  clampSensorTelemetryInterpolationMinMs,
  clampSensorTelemetryInterpolationThresholdMs,
  normalizeSensorTelemetryIconPulseAnimationPreset,
  normalizeSensorTelemetryIconPulseIntensityPreset,
  normalizeSensorTelemetryIconPulsePeakColorHex,
  normalizeSensorTelemetryTweenEase,
} from "../config/sensorTelemetryUiConfig.js";

/** BMI270 `sensor.bmi270.mode.set` payload: raw=0, fusion=1, hybrid=2 (matches firmware). */
export type Bmi270StreamModeUi = "raw" | "fusion" | "hybrid";

export function normalizeBmi270StreamMode(value: unknown): Bmi270StreamModeUi {
  if (value === "raw" || value === "fusion" || value === "hybrid") {
    return value;
  }
  return "hybrid";
}

/** Firmware clamps BSX fusion feed period to [10, 100] ms (CM55 `BITSTREAM_PROTOCOL_PROCESS_TICK_MS` .. max). */
export function clampBmi270FusionFeedIntervalMs(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 10;
  return Math.max(10, Math.min(100, n));
}

export interface BitstreamConfigState {
  wsUrl: string;
  serialPath: string;
  /** User-defined COM order in recovery / port manager (paths only). */
  serialPortDisplayOrder: string[];
  whitelistedSerialPaths: string[];
  baudRateText: string;
  uiFlushIntervalMs: number;
  /** BMI270 stream output: raw IMU vs fusion vs hybrid (device `sensor.bmi270.mode.set`). */
  bmi270StreamMode: Bmi270StreamModeUi;
  /** Last firmware-applied BSX fusion feed interval (`sensor.bmi270.fusion.feed.*`). */
  bmi270FusionFeedIntervalMs: number;
  /**
   * When true, wire-rate fusion quaternion tap rejects single-frame orientation spikes
   * (rate-based Δθ gate) before the 3D preview and quaternion wire overlay.
   */
  bmi270FusionQuatSpikeRejectEnabled: boolean;
  /** Preferred firmware log level selected in Wi-Fi panel (0..5). */
  firmwareLogLevelUi: number;
  /** How UI decides between ACK-confirmed vs fire-and-forget command sends. */
  commandConfirmationMode: "auto" | "reliable" | "fast";
  /** When true, auto-manage firmware log level (boot high, stable low). */
  firmwareLogLevelAutoEnabled: boolean;
  /** When true, do not auto-change log level because user explicitly applied a level. */
  firmwareLogLevelUserLocked: boolean;
  diagMajorText: string;
  diagMinorText: string;
  diagGlobalPeriodText: string;
  diagTaskPeriodText: string;
  /** GSAP numeric tween for sparse live samples (BMI270 deck + other sensor metric rows). */
  sensorTelemetryValueTweenEnabled: boolean;
  sensorTelemetryValueTweenEase: SensorTelemetryTweenEase;
  sensorTelemetryInterpolationThresholdMs: number;
  sensorTelemetryInterpolationMinMs: number;
  sensorTelemetryInterpolationMaxMs: number;
  /** Icon pulse on value change (independent of value tween). */
  sensorTelemetryIconPulseEnabled: boolean;
  sensorTelemetryIconPulseThrottleMs: number;
  sensorTelemetryIconPulseIntensityPreset: SensorTelemetryIconPulseIntensityPreset;
  /** Peak Lucide stroke tint at pulse apex (`#rrggbb`). */
  sensorTelemetryIconPulsePeakColorHex: string;
  /** GSAP ease family for icon pulse motion (peak / mid / return segments). */
  sensorTelemetryIconPulseAnimationPreset: SensorTelemetryIconPulseAnimationPreset;
  /** Tween icon stroke to peak color during pulse; when false, scale/rotation only. */
  sensorTelemetryIconPulseColorAnimationEnabled: boolean;
  /**
   * Color policy for fusion "last update" Δt badge.
   * Thresholds are ratios of (Δt / expectedSamplingIntervalMs).
   */
  fusionUpdateDeltaWarnMultiplier: number;
  fusionUpdateDeltaBadMultiplier: number;
  /** When true, blend colors smoothly within each band (green→yellow, yellow→red). */
  fusionUpdateDeltaUseRamp: boolean;
  fusionUpdateDeltaGoodColorHex: string;
  fusionUpdateDeltaWarnColorHex: string;
  fusionUpdateDeltaBadColorHex: string;
  /** Header badge content policy for timestamp + Δt. */
  telemetryUpdateBadgeMode: "both" | "timestamp" | "delta" | "off";
  /** Which clock drives Δt when badge shows delta (device tMs vs host ingest). */
  telemetryUpdateDeltaSource: "device" | "host" | "both";
  /** Telemetry Meta card: show sample counter, Hz, or both per row. */
  telemetryMetaDisplayMode: "counter" | "hz" | "both";
  /** Telemetry Meta Hz row: which smoothed rate estimate to show. */
  telemetryMetaRateSource: "device" | "host" | "counter" | "smoothed";
  /** BMI270 Euler Angles telemetry card: signed rad, signed deg, or 0…360°. */
  bmi270FusionEulerDisplayMode:
    | "signed-pi-rad"
    | "signed-deg"
    | "unsigned-deg";
  /** Global temperature display unit for all temperature cards. */
  temperatureDisplayUnit: "c" | "f" | "k";
  /** Global temperature precision (decimal places) for all temperature cards. */
  temperatureDisplayFractionDigits: 0 | 1 | 2;
  /** BMM350 Magnetometer: show |B| magnitude row. */
  bmm350MagShowMagnitude: boolean;
  /** BMM350 Magnetometer: axis / |B| gauge full-scale preset. */
  bmm350MagGaugeRange: "earth" | "wide" | "auto";
  /** BMI270 Quaternion: show ‖q‖ norm row. */
  bmi270FusionQuatShowNorm: boolean;
  /** BMI270 Quaternion: display-only; flip sign so qw >= 0 (same rotation). */
  bmi270FusionQuatPreferPositiveW: boolean;
  /** DPS368 Pressure card: display unit. */
  dps368PressureDisplayUnit: "hpa" | "kpa" | "pa";
  /** DPS368 Pressure card: decimal places. */
  dps368PressureDisplayFractionDigits: 0 | 1 | 2;
  /** DPS368 Pressure card: bar gauge full-scale preset. */
  dps368PressureGaugeRange: "sea-level" | "full" | "auto";
  /**
   * When true, after any enabled sensor’s decode age exceeds **samplingIntervalMs × multiplier**,
   * automatically reset HostSession (same as Reconnect telemetry). Cooldown + hourly cap apply.
   */
  autoRecoverStaleSensorDecodeEnabled: boolean;
  /** Stale threshold per sensor: `samplingIntervalMs ×` this value (2, 3, or 4). */
  sensorDecodeStaleIntervalMultiplier: 2 | 3 | 4;
  /**
   * When true, emit **one** System log line when the wedge predicate turns **true** (rising edge),
   * for support bundles. Default off in production.
   */
  telemetryWedgeDiagnosticLogEnabled: boolean;
  /**
   * When true, count inbound Bitstream frames by **wire channel** and show them in **Telemetry diagnostics**
   * (dev / support). Adds a small amount of work per frame; default off.
   */
  telemetryDecodeDebugEnabled: boolean;
  /** BS2 UART: open saved `serialPath` on app start when bridge + port are available. */
  bs2AutoConnectOnStartup: boolean;
}

interface BitstreamConfigActions {
  setWsUrl: (value: string) => void;
  setSerialPath: (value: string) => void;
  setSerialPortDisplayOrder: (paths: string[]) => void;
  syncSerialPortDisplayOrderWithAvailable: (availablePaths: string[]) => void;
  toggleWhitelistedSerialPath: (path: string) => void;
  setWhitelistedSerialPaths: (paths: string[]) => void;
  setBaudRateText: (value: string) => void;
  setUiFlushIntervalMs: (value: number) => void;
  setBmi270StreamMode: (value: Bmi270StreamModeUi) => void;
  setBmi270FusionFeedIntervalMs: (value: number) => void;
  setBmi270FusionQuatSpikeRejectEnabled: (value: boolean) => void;
  setFirmwareLogLevelUi: (value: number) => void;
  setCommandConfirmationMode: (
    value: BitstreamConfigState["commandConfirmationMode"],
  ) => void;
  setFirmwareLogLevelAutoEnabled: (value: boolean) => void;
  setFirmwareLogLevelUserLocked: (value: boolean) => void;
  setDiagMajorText: (value: string) => void;
  setDiagMinorText: (value: string) => void;
  setDiagGlobalPeriodText: (value: string) => void;
  setDiagTaskPeriodText: (value: string) => void;
  setSensorTelemetryValueTweenEnabled: (value: boolean) => void;
  setSensorTelemetryValueTweenEase: (value: SensorTelemetryTweenEase) => void;
  setSensorTelemetryInterpolationThresholdMs: (value: number) => void;
  setSensorTelemetryInterpolationMinMs: (value: number) => void;
  setSensorTelemetryInterpolationMaxMs: (value: number) => void;
  setSensorTelemetryIconPulseEnabled: (value: boolean) => void;
  setSensorTelemetryIconPulseThrottleMs: (value: number) => void;
  setSensorTelemetryIconPulseIntensityPreset: (
    value: SensorTelemetryIconPulseIntensityPreset,
  ) => void;
  setSensorTelemetryIconPulsePeakColorHex: (value: string) => void;
  setSensorTelemetryIconPulseAnimationPreset: (
    value: SensorTelemetryIconPulseAnimationPreset,
  ) => void;
  setSensorTelemetryIconPulseColorAnimationEnabled: (value: boolean) => void;
  setFusionUpdateDeltaWarnMultiplier: (value: number) => void;
  setFusionUpdateDeltaBadMultiplier: (value: number) => void;
  setFusionUpdateDeltaUseRamp: (value: boolean) => void;
  setFusionUpdateDeltaGoodColorHex: (value: string) => void;
  setFusionUpdateDeltaWarnColorHex: (value: string) => void;
  setFusionUpdateDeltaBadColorHex: (value: string) => void;
  setTelemetryUpdateBadgeMode: (value: BitstreamConfigState["telemetryUpdateBadgeMode"]) => void;
  setTelemetryUpdateDeltaSource: (value: BitstreamConfigState["telemetryUpdateDeltaSource"]) => void;
  setTelemetryMetaDisplayMode: (value: BitstreamConfigState["telemetryMetaDisplayMode"]) => void;
  setTelemetryMetaRateSource: (value: BitstreamConfigState["telemetryMetaRateSource"]) => void;
  setBmi270FusionEulerDisplayMode: (
    value: BitstreamConfigState["bmi270FusionEulerDisplayMode"],
  ) => void;
  setTemperatureDisplayUnit: (value: BitstreamConfigState["temperatureDisplayUnit"]) => void;
  setTemperatureDisplayFractionDigits: (
    value: BitstreamConfigState["temperatureDisplayFractionDigits"],
  ) => void;
  setBmm350MagShowMagnitude: (value: boolean) => void;
  setBmm350MagGaugeRange: (value: BitstreamConfigState["bmm350MagGaugeRange"]) => void;
  setBmi270FusionQuatShowNorm: (value: boolean) => void;
  setBmi270FusionQuatPreferPositiveW: (value: boolean) => void;
  setDps368PressureDisplayUnit: (value: BitstreamConfigState["dps368PressureDisplayUnit"]) => void;
  setDps368PressureDisplayFractionDigits: (
    value: BitstreamConfigState["dps368PressureDisplayFractionDigits"],
  ) => void;
  setDps368PressureGaugeRange: (value: BitstreamConfigState["dps368PressureGaugeRange"]) => void;
  setAutoRecoverStaleSensorDecodeEnabled: (value: boolean) => void;
  setSensorDecodeStaleIntervalMultiplier: (value: 2 | 3 | 4) => void;
  setTelemetryWedgeDiagnosticLogEnabled: (value: boolean) => void;
  setTelemetryDecodeDebugEnabled: (value: boolean) => void;
  setBs2AutoConnectOnStartup: (value: boolean) => void;
  /** Merge validated fields from host JSON mirror (extension globalStorage). */
  mergeHostOverlay: (raw: unknown) => void;
}

export type BitstreamConfigStore = BitstreamConfigState & BitstreamConfigActions;

export const BITSTREAM_DASHBOARD_CONFIG_STORAGE_KEY = "bitstream-dashboard-config-v2";

const STORAGE_KEY = BITSTREAM_DASHBOARD_CONFIG_STORAGE_KEY;

function clampUiFlushIntervalMs(value: unknown): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 16;
  return Math.max(16, Math.min(250, Math.round(numeric)));
}

function loadSavedConfig(): Partial<BitstreamConfigState> | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parseConfigOverlay(parsed);
  } catch {
    return null;
  }
}

export function serializePersistedBitstreamConfig(state: BitstreamConfigState): string {
  return JSON.stringify({
    wsUrl: state.wsUrl,
    serialPath: state.serialPath,
    serialPortDisplayOrder: state.serialPortDisplayOrder,
    whitelistedSerialPaths: state.whitelistedSerialPaths,
    baudRateText: state.baudRateText,
    uiFlushIntervalMs: state.uiFlushIntervalMs,
    bmi270StreamMode: state.bmi270StreamMode,
    bmi270FusionFeedIntervalMs: state.bmi270FusionFeedIntervalMs,
    bmi270FusionQuatSpikeRejectEnabled: state.bmi270FusionQuatSpikeRejectEnabled,
    firmwareLogLevelUi: state.firmwareLogLevelUi,
    commandConfirmationMode: state.commandConfirmationMode,
    diagMajorText: state.diagMajorText,
    diagMinorText: state.diagMinorText,
    diagGlobalPeriodText: state.diagGlobalPeriodText,
    diagTaskPeriodText: state.diagTaskPeriodText,
    sensorTelemetryValueTweenEnabled: state.sensorTelemetryValueTweenEnabled,
    sensorTelemetryValueTweenEase: state.sensorTelemetryValueTweenEase,
    sensorTelemetryInterpolationThresholdMs: state.sensorTelemetryInterpolationThresholdMs,
    sensorTelemetryInterpolationMinMs: state.sensorTelemetryInterpolationMinMs,
    sensorTelemetryInterpolationMaxMs: state.sensorTelemetryInterpolationMaxMs,
    sensorTelemetryIconPulseEnabled: state.sensorTelemetryIconPulseEnabled,
    sensorTelemetryIconPulseThrottleMs: state.sensorTelemetryIconPulseThrottleMs,
    sensorTelemetryIconPulseIntensityPreset: state.sensorTelemetryIconPulseIntensityPreset,
    sensorTelemetryIconPulsePeakColorHex: state.sensorTelemetryIconPulsePeakColorHex,
    sensorTelemetryIconPulseAnimationPreset: state.sensorTelemetryIconPulseAnimationPreset,
    sensorTelemetryIconPulseColorAnimationEnabled: state.sensorTelemetryIconPulseColorAnimationEnabled,
    fusionUpdateDeltaWarnMultiplier: state.fusionUpdateDeltaWarnMultiplier,
    fusionUpdateDeltaBadMultiplier: state.fusionUpdateDeltaBadMultiplier,
    fusionUpdateDeltaUseRamp: state.fusionUpdateDeltaUseRamp,
    fusionUpdateDeltaGoodColorHex: state.fusionUpdateDeltaGoodColorHex,
    fusionUpdateDeltaWarnColorHex: state.fusionUpdateDeltaWarnColorHex,
    fusionUpdateDeltaBadColorHex: state.fusionUpdateDeltaBadColorHex,
    telemetryUpdateBadgeMode: state.telemetryUpdateBadgeMode,
    telemetryUpdateDeltaSource: state.telemetryUpdateDeltaSource,
    telemetryMetaDisplayMode: state.telemetryMetaDisplayMode,
    telemetryMetaRateSource: state.telemetryMetaRateSource,
    bmi270FusionEulerDisplayMode: state.bmi270FusionEulerDisplayMode,
    temperatureDisplayUnit: state.temperatureDisplayUnit,
    temperatureDisplayFractionDigits: state.temperatureDisplayFractionDigits,
    bmm350MagShowMagnitude: state.bmm350MagShowMagnitude,
    bmm350MagGaugeRange: state.bmm350MagGaugeRange,
    bmi270FusionQuatShowNorm: state.bmi270FusionQuatShowNorm,
    bmi270FusionQuatPreferPositiveW: state.bmi270FusionQuatPreferPositiveW,
    dps368PressureDisplayUnit: state.dps368PressureDisplayUnit,
    dps368PressureDisplayFractionDigits: state.dps368PressureDisplayFractionDigits,
    dps368PressureGaugeRange: state.dps368PressureGaugeRange,
    autoRecoverStaleSensorDecodeEnabled: state.autoRecoverStaleSensorDecodeEnabled,
    sensorDecodeStaleIntervalMultiplier: state.sensorDecodeStaleIntervalMultiplier,
    telemetryWedgeDiagnosticLogEnabled: state.telemetryWedgeDiagnosticLogEnabled,
    telemetryDecodeDebugEnabled: state.telemetryDecodeDebugEnabled,
    bs2AutoConnectOnStartup: state.bs2AutoConnectOnStartup,
  });
}

function normalizeHexColor(value: unknown, fallback: string): string {
  const s = typeof value === "string" ? value.trim() : "";
  const hex = s.startsWith("#") ? s : s.length ? `#${s}` : "";
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  return fallback;
}

function clampFusionUpdateDeltaMultiplier(value: unknown, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  // allow wide range but keep sane
  return Math.max(1, Math.min(4, Math.round(n * 100) / 100));
}

function parseConfigOverlay(raw: unknown): Partial<BitstreamConfigState> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const patch: Partial<BitstreamConfigState> = {};

  if (typeof o.wsUrl === "string") {
    patch.wsUrl = o.wsUrl;
  }
  if (typeof o.serialPath === "string") {
    patch.serialPath = o.serialPath;
  }
  if (Array.isArray(o.serialPortDisplayOrder)) {
    const serialPortDisplayOrder = Array.from(
      new Set(
        o.serialPortDisplayOrder
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      ),
    );
    patch.serialPortDisplayOrder = serialPortDisplayOrder;
  }
  if (Array.isArray(o.whitelistedSerialPaths)) {
    const whitelistedSerialPaths = Array.from(
      new Set(
        o.whitelistedSerialPaths
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      ),
    );
    patch.whitelistedSerialPaths = whitelistedSerialPaths;
  }
  if (typeof o.baudRateText === "string" || typeof o.baudRateText === "number") {
    patch.baudRateText = normalizeBitstreamBaudRateText(String(o.baudRateText));
  }
  if (typeof o.uiFlushIntervalMs === "number" && Number.isFinite(o.uiFlushIntervalMs)) {
    patch.uiFlushIntervalMs = clampUiFlushIntervalMs(o.uiFlushIntervalMs);
  }
  if (o.bmi270StreamMode !== undefined) {
    patch.bmi270StreamMode = normalizeBmi270StreamMode(o.bmi270StreamMode);
  }
  if (typeof o.bmi270FusionFeedIntervalMs === "number" && Number.isFinite(o.bmi270FusionFeedIntervalMs)) {
    patch.bmi270FusionFeedIntervalMs = clampBmi270FusionFeedIntervalMs(o.bmi270FusionFeedIntervalMs);
  }
  if (typeof o.bmi270FusionQuatSpikeRejectEnabled === "boolean") {
    patch.bmi270FusionQuatSpikeRejectEnabled = o.bmi270FusionQuatSpikeRejectEnabled;
  }
  if (typeof o.firmwareLogLevelUi === "number" && Number.isFinite(o.firmwareLogLevelUi)) {
    patch.firmwareLogLevelUi = Math.max(0, Math.min(5, Math.round(o.firmwareLogLevelUi)));
  }
  if (
    o.commandConfirmationMode === "auto" ||
    o.commandConfirmationMode === "reliable" ||
    o.commandConfirmationMode === "fast"
  ) {
    patch.commandConfirmationMode = o.commandConfirmationMode;
  }
  if (typeof o.diagMajorText === "string") {
    patch.diagMajorText = o.diagMajorText;
  }
  if (typeof o.diagMinorText === "string") {
    patch.diagMinorText = o.diagMinorText;
  }
  if (typeof o.diagGlobalPeriodText === "string") {
    patch.diagGlobalPeriodText = o.diagGlobalPeriodText;
  }
  if (typeof o.diagTaskPeriodText === "string") {
    patch.diagTaskPeriodText = o.diagTaskPeriodText;
  }
  if (typeof o.sensorTelemetryValueTweenEnabled === "boolean") {
    patch.sensorTelemetryValueTweenEnabled = o.sensorTelemetryValueTweenEnabled;
  }
  if (o.sensorTelemetryValueTweenEase !== undefined) {
    patch.sensorTelemetryValueTweenEase = normalizeSensorTelemetryTweenEase(
      o.sensorTelemetryValueTweenEase,
    );
  }
  if (typeof o.sensorTelemetryInterpolationThresholdMs === "number") {
    patch.sensorTelemetryInterpolationThresholdMs =
      clampSensorTelemetryInterpolationThresholdMs(o.sensorTelemetryInterpolationThresholdMs);
  }
  if (typeof o.sensorTelemetryInterpolationMinMs === "number") {
    patch.sensorTelemetryInterpolationMinMs = clampSensorTelemetryInterpolationMinMs(
      o.sensorTelemetryInterpolationMinMs,
    );
  }
  if (typeof o.fusionUpdateDeltaWarnMultiplier === "number") {
    patch.fusionUpdateDeltaWarnMultiplier = clampFusionUpdateDeltaMultiplier(
      o.fusionUpdateDeltaWarnMultiplier,
      getDefaults().fusionUpdateDeltaWarnMultiplier,
    );
  }
  if (typeof o.fusionUpdateDeltaBadMultiplier === "number") {
    patch.fusionUpdateDeltaBadMultiplier = clampFusionUpdateDeltaMultiplier(
      o.fusionUpdateDeltaBadMultiplier,
      getDefaults().fusionUpdateDeltaBadMultiplier,
    );
  }
  if (typeof o.fusionUpdateDeltaUseRamp === "boolean") {
    patch.fusionUpdateDeltaUseRamp = o.fusionUpdateDeltaUseRamp;
  }
  if (typeof o.fusionUpdateDeltaGoodColorHex === "string") {
    patch.fusionUpdateDeltaGoodColorHex = normalizeHexColor(
      o.fusionUpdateDeltaGoodColorHex,
      getDefaults().fusionUpdateDeltaGoodColorHex,
    );
  }
  if (typeof o.fusionUpdateDeltaWarnColorHex === "string") {
    patch.fusionUpdateDeltaWarnColorHex = normalizeHexColor(
      o.fusionUpdateDeltaWarnColorHex,
      getDefaults().fusionUpdateDeltaWarnColorHex,
    );
  }
  if (typeof o.fusionUpdateDeltaBadColorHex === "string") {
    patch.fusionUpdateDeltaBadColorHex = normalizeHexColor(
      o.fusionUpdateDeltaBadColorHex,
      getDefaults().fusionUpdateDeltaBadColorHex,
    );
  }
  if (
    o.telemetryUpdateBadgeMode === "both" ||
    o.telemetryUpdateBadgeMode === "timestamp" ||
    o.telemetryUpdateBadgeMode === "delta" ||
    o.telemetryUpdateBadgeMode === "off"
  ) {
    patch.telemetryUpdateBadgeMode = o.telemetryUpdateBadgeMode;
  }
  if (
    o.telemetryUpdateDeltaSource === "device" ||
    o.telemetryUpdateDeltaSource === "host" ||
    o.telemetryUpdateDeltaSource === "both"
  ) {
    patch.telemetryUpdateDeltaSource = o.telemetryUpdateDeltaSource;
  }
  if (
    o.telemetryMetaDisplayMode === "counter" ||
    o.telemetryMetaDisplayMode === "hz" ||
    o.telemetryMetaDisplayMode === "both"
  ) {
    patch.telemetryMetaDisplayMode = o.telemetryMetaDisplayMode;
  }
  if (
    o.telemetryMetaRateSource === "device" ||
    o.telemetryMetaRateSource === "host" ||
    o.telemetryMetaRateSource === "counter" ||
    o.telemetryMetaRateSource === "smoothed"
  ) {
    patch.telemetryMetaRateSource = o.telemetryMetaRateSource;
  }
  if (
    o.bmi270FusionEulerDisplayMode === "signed-pi-rad" ||
    o.bmi270FusionEulerDisplayMode === "signed-deg" ||
    o.bmi270FusionEulerDisplayMode === "unsigned-deg"
  ) {
    patch.bmi270FusionEulerDisplayMode = o.bmi270FusionEulerDisplayMode;
  }
  if (
    o.temperatureDisplayUnit === "c" ||
    o.temperatureDisplayUnit === "f" ||
    o.temperatureDisplayUnit === "k"
  ) {
    patch.temperatureDisplayUnit = o.temperatureDisplayUnit;
  }
  if (
    o.temperatureDisplayFractionDigits === 0 ||
    o.temperatureDisplayFractionDigits === 1 ||
    o.temperatureDisplayFractionDigits === 2
  ) {
    patch.temperatureDisplayFractionDigits = o.temperatureDisplayFractionDigits;
  }
  if (typeof o.bmm350MagShowMagnitude === "boolean") {
    patch.bmm350MagShowMagnitude = o.bmm350MagShowMagnitude;
  }
  if (
    o.bmm350MagGaugeRange === "earth" ||
    o.bmm350MagGaugeRange === "wide" ||
    o.bmm350MagGaugeRange === "auto"
  ) {
    patch.bmm350MagGaugeRange = o.bmm350MagGaugeRange;
  }
  if (typeof o.bmi270FusionQuatShowNorm === "boolean") {
    patch.bmi270FusionQuatShowNorm = o.bmi270FusionQuatShowNorm;
  }
  if (typeof o.bmi270FusionQuatPreferPositiveW === "boolean") {
    patch.bmi270FusionQuatPreferPositiveW = o.bmi270FusionQuatPreferPositiveW;
  }
  if (
    o.dps368PressureDisplayUnit === "hpa" ||
    o.dps368PressureDisplayUnit === "kpa" ||
    o.dps368PressureDisplayUnit === "pa"
  ) {
    patch.dps368PressureDisplayUnit = o.dps368PressureDisplayUnit;
  }
  if (
    o.dps368PressureDisplayFractionDigits === 0 ||
    o.dps368PressureDisplayFractionDigits === 1 ||
    o.dps368PressureDisplayFractionDigits === 2
  ) {
    patch.dps368PressureDisplayFractionDigits = o.dps368PressureDisplayFractionDigits;
  }
  if (
    o.dps368PressureGaugeRange === "sea-level" ||
    o.dps368PressureGaugeRange === "full" ||
    o.dps368PressureGaugeRange === "auto"
  ) {
    patch.dps368PressureGaugeRange = o.dps368PressureGaugeRange;
  }
  if (typeof o.autoRecoverStaleSensorDecodeEnabled === "boolean") {
    patch.autoRecoverStaleSensorDecodeEnabled = o.autoRecoverStaleSensorDecodeEnabled;
  } else if (typeof o.autoReconnectTelemetryWhenWedgedEnabled === "boolean") {
    patch.autoRecoverStaleSensorDecodeEnabled = o.autoReconnectTelemetryWhenWedgedEnabled;
  }
  if (o.sensorDecodeStaleIntervalMultiplier !== undefined) {
    patch.sensorDecodeStaleIntervalMultiplier = clampSensorDecodeStaleIntervalMultiplier(
      o.sensorDecodeStaleIntervalMultiplier,
    );
  }
  if (typeof o.telemetryWedgeDiagnosticLogEnabled === "boolean") {
    patch.telemetryWedgeDiagnosticLogEnabled = o.telemetryWedgeDiagnosticLogEnabled;
  }
  if (typeof o.telemetryDecodeDebugEnabled === "boolean") {
    patch.telemetryDecodeDebugEnabled = o.telemetryDecodeDebugEnabled;
  }
  if (typeof o.bs2AutoConnectOnStartup === "boolean") {
    patch.bs2AutoConnectOnStartup = o.bs2AutoConnectOnStartup;
  }
  if (typeof o.sensorTelemetryInterpolationMaxMs === "number") {
    patch.sensorTelemetryInterpolationMaxMs = clampSensorTelemetryInterpolationMaxMs(
      o.sensorTelemetryInterpolationMaxMs,
    );
  }
  if (typeof o.sensorTelemetryIconPulseEnabled === "boolean") {
    patch.sensorTelemetryIconPulseEnabled = o.sensorTelemetryIconPulseEnabled;
  }
  if (typeof o.sensorTelemetryIconPulseThrottleMs === "number") {
    patch.sensorTelemetryIconPulseThrottleMs = clampSensorTelemetryIconPulseThrottleMs(
      o.sensorTelemetryIconPulseThrottleMs,
    );
  }
  if (o.sensorTelemetryIconPulseIntensityPreset !== undefined) {
    patch.sensorTelemetryIconPulseIntensityPreset =
      normalizeSensorTelemetryIconPulseIntensityPreset(o.sensorTelemetryIconPulseIntensityPreset);
  }
  if (typeof o.sensorTelemetryIconPulsePeakColorHex === "string") {
    patch.sensorTelemetryIconPulsePeakColorHex = normalizeSensorTelemetryIconPulsePeakColorHex(
      o.sensorTelemetryIconPulsePeakColorHex,
    );
  } else if (o.sensorTelemetryIconPulseColorPreset !== undefined) {
    patch.sensorTelemetryIconPulsePeakColorHex = normalizeSensorTelemetryIconPulsePeakColorHex(
      undefined,
      o.sensorTelemetryIconPulseColorPreset,
    );
  }
  if (o.sensorTelemetryIconPulseAnimationPreset !== undefined) {
    patch.sensorTelemetryIconPulseAnimationPreset =
      normalizeSensorTelemetryIconPulseAnimationPreset(o.sensorTelemetryIconPulseAnimationPreset);
  }
  if (typeof o.sensorTelemetryIconPulseColorAnimationEnabled === "boolean") {
    patch.sensorTelemetryIconPulseColorAnimationEnabled = o.sensorTelemetryIconPulseColorAnimationEnabled;
  }

  return patch;
}

function saveConfig(next: BitstreamConfigState): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, serializePersistedBitstreamConfig(next));
  } catch {
    // Ignore persistence failures in restricted environments.
  }
}

function getDefaults(): BitstreamConfigState {
  return {
    wsUrl: getBitstreamWsClientUrl(),
    serialPath: "COM3",
    serialPortDisplayOrder: [],
    whitelistedSerialPaths: [],
    baudRateText: BITSTREAM_DEFAULT_BAUD_RATE_TEXT,
    /** Default ~60 Hz cap for live metrics; lower coalescing vs 33 ms for sensor previews. */
    uiFlushIntervalMs: 16,
    bmi270StreamMode: "hybrid",
    bmi270FusionFeedIntervalMs: 10,
    bmi270FusionQuatSpikeRejectEnabled: false,
    firmwareLogLevelUi: 2,
    firmwareLogLevelAutoEnabled: true,
    firmwareLogLevelUserLocked: false,
    diagMajorText: "2",
    diagMinorText: "0",
    diagGlobalPeriodText: "500",
    diagTaskPeriodText: "500",
    sensorTelemetryValueTweenEnabled: false,
    sensorTelemetryValueTweenEase: "none",
    sensorTelemetryInterpolationThresholdMs: 250,
    sensorTelemetryInterpolationMinMs: 500,
    sensorTelemetryInterpolationMaxMs: 2500,
    sensorTelemetryIconPulseEnabled: false,
    sensorTelemetryIconPulseThrottleMs: 280,
    sensorTelemetryIconPulseIntensityPreset: "normal",
    sensorTelemetryIconPulsePeakColorHex: "#4ade80",
    sensorTelemetryIconPulseAnimationPreset: "smooth",
    sensorTelemetryIconPulseColorAnimationEnabled: true,
    fusionUpdateDeltaWarnMultiplier: 1.5,
    fusionUpdateDeltaBadMultiplier: 2.0,
    fusionUpdateDeltaUseRamp: true,
    fusionUpdateDeltaGoodColorHex: "#22c55e",
    fusionUpdateDeltaWarnColorHex: "#facc15",
    fusionUpdateDeltaBadColorHex: "#ef4444",
    telemetryUpdateBadgeMode: "both",
    telemetryUpdateDeltaSource: "device",
    telemetryMetaDisplayMode: "counter",
    telemetryMetaRateSource: "device",
    bmi270FusionEulerDisplayMode: "signed-pi-rad",
    temperatureDisplayUnit: "c",
    temperatureDisplayFractionDigits: 2,
    bmm350MagShowMagnitude: false,
    bmm350MagGaugeRange: "earth",
    bmi270FusionQuatShowNorm: false,
    bmi270FusionQuatPreferPositiveW: false,
    dps368PressureDisplayUnit: "hpa",
    dps368PressureDisplayFractionDigits: 1,
    dps368PressureGaugeRange: "sea-level",
    autoRecoverStaleSensorDecodeEnabled: false,
    sensorDecodeStaleIntervalMultiplier: 2,
    telemetryWedgeDiagnosticLogEnabled: false,
    telemetryDecodeDebugEnabled: false,
    bs2AutoConnectOnStartup: true,
  };
}

function normalizeSensorTelemetryFields(
  input: BitstreamConfigState,
): BitstreamConfigState {
  const pair = clampInterpolationMinMaxPair(
    clampSensorTelemetryInterpolationMinMs(input.sensorTelemetryInterpolationMinMs),
    clampSensorTelemetryInterpolationMaxMs(input.sensorTelemetryInterpolationMaxMs),
  );
  const warn = clampFusionUpdateDeltaMultiplier(
    input.fusionUpdateDeltaWarnMultiplier,
    getDefaults().fusionUpdateDeltaWarnMultiplier,
  );
  const badRaw = clampFusionUpdateDeltaMultiplier(
    input.fusionUpdateDeltaBadMultiplier,
    getDefaults().fusionUpdateDeltaBadMultiplier,
  );
  const bad = Math.max(badRaw, warn + 0.05);
  return {
    ...input,
    sensorTelemetryValueTweenEnabled:
      typeof input.sensorTelemetryValueTweenEnabled === "boolean"
        ? input.sensorTelemetryValueTweenEnabled
        : getDefaults().sensorTelemetryValueTweenEnabled,
    sensorTelemetryValueTweenEase: normalizeSensorTelemetryTweenEase(
      input.sensorTelemetryValueTweenEase,
    ),
    sensorTelemetryInterpolationThresholdMs: clampSensorTelemetryInterpolationThresholdMs(
      input.sensorTelemetryInterpolationThresholdMs,
    ),
    sensorTelemetryInterpolationMinMs: pair.minMs,
    sensorTelemetryInterpolationMaxMs: pair.maxMs,
    sensorTelemetryIconPulseEnabled:
      typeof input.sensorTelemetryIconPulseEnabled === "boolean"
        ? input.sensorTelemetryIconPulseEnabled
        : getDefaults().sensorTelemetryIconPulseEnabled,
    sensorTelemetryIconPulseThrottleMs: clampSensorTelemetryIconPulseThrottleMs(
      input.sensorTelemetryIconPulseThrottleMs,
    ),
    sensorTelemetryIconPulseIntensityPreset: normalizeSensorTelemetryIconPulseIntensityPreset(
      input.sensorTelemetryIconPulseIntensityPreset,
    ),
    sensorTelemetryIconPulsePeakColorHex: normalizeSensorTelemetryIconPulsePeakColorHex(
      input.sensorTelemetryIconPulsePeakColorHex,
      (input as unknown as Record<string, unknown>)["sensorTelemetryIconPulseColorPreset"],
    ),
    sensorTelemetryIconPulseAnimationPreset: normalizeSensorTelemetryIconPulseAnimationPreset(
      input.sensorTelemetryIconPulseAnimationPreset,
    ),
    sensorTelemetryIconPulseColorAnimationEnabled:
      typeof input.sensorTelemetryIconPulseColorAnimationEnabled === "boolean"
        ? input.sensorTelemetryIconPulseColorAnimationEnabled
        : getDefaults().sensorTelemetryIconPulseColorAnimationEnabled,
    fusionUpdateDeltaWarnMultiplier: warn,
    fusionUpdateDeltaBadMultiplier: bad,
    fusionUpdateDeltaUseRamp:
      typeof input.fusionUpdateDeltaUseRamp === "boolean"
        ? input.fusionUpdateDeltaUseRamp
        : getDefaults().fusionUpdateDeltaUseRamp,
    fusionUpdateDeltaGoodColorHex: normalizeHexColor(
      input.fusionUpdateDeltaGoodColorHex,
      getDefaults().fusionUpdateDeltaGoodColorHex,
    ),
    fusionUpdateDeltaWarnColorHex: normalizeHexColor(
      input.fusionUpdateDeltaWarnColorHex,
      getDefaults().fusionUpdateDeltaWarnColorHex,
    ),
    fusionUpdateDeltaBadColorHex: normalizeHexColor(
      input.fusionUpdateDeltaBadColorHex,
      getDefaults().fusionUpdateDeltaBadColorHex,
    ),
    telemetryUpdateBadgeMode:
      input.telemetryUpdateBadgeMode === "both" ||
      input.telemetryUpdateBadgeMode === "timestamp" ||
      input.telemetryUpdateBadgeMode === "delta" ||
      input.telemetryUpdateBadgeMode === "off"
        ? input.telemetryUpdateBadgeMode
        : getDefaults().telemetryUpdateBadgeMode,
    telemetryUpdateDeltaSource:
      input.telemetryUpdateDeltaSource === "device" ||
      input.telemetryUpdateDeltaSource === "host" ||
      input.telemetryUpdateDeltaSource === "both"
        ? input.telemetryUpdateDeltaSource
        : getDefaults().telemetryUpdateDeltaSource,
    telemetryMetaDisplayMode:
      input.telemetryMetaDisplayMode === "counter" ||
      input.telemetryMetaDisplayMode === "hz" ||
      input.telemetryMetaDisplayMode === "both"
        ? input.telemetryMetaDisplayMode
        : getDefaults().telemetryMetaDisplayMode,
    telemetryMetaRateSource:
      input.telemetryMetaRateSource === "device" ||
      input.telemetryMetaRateSource === "host" ||
      input.telemetryMetaRateSource === "counter" ||
      input.telemetryMetaRateSource === "smoothed"
        ? input.telemetryMetaRateSource
        : getDefaults().telemetryMetaRateSource,
    bmi270FusionEulerDisplayMode:
      input.bmi270FusionEulerDisplayMode === "signed-pi-rad" ||
      input.bmi270FusionEulerDisplayMode === "signed-deg" ||
      input.bmi270FusionEulerDisplayMode === "unsigned-deg"
        ? input.bmi270FusionEulerDisplayMode
        : getDefaults().bmi270FusionEulerDisplayMode,
    temperatureDisplayUnit:
      input.temperatureDisplayUnit === "c" ||
      input.temperatureDisplayUnit === "f" ||
      input.temperatureDisplayUnit === "k"
        ? input.temperatureDisplayUnit
        : getDefaults().temperatureDisplayUnit,
    temperatureDisplayFractionDigits:
      input.temperatureDisplayFractionDigits === 0 ||
      input.temperatureDisplayFractionDigits === 1 ||
      input.temperatureDisplayFractionDigits === 2
        ? input.temperatureDisplayFractionDigits
        : getDefaults().temperatureDisplayFractionDigits,
    bmm350MagShowMagnitude:
      typeof input.bmm350MagShowMagnitude === "boolean"
        ? input.bmm350MagShowMagnitude
        : getDefaults().bmm350MagShowMagnitude,
    bmm350MagGaugeRange:
      input.bmm350MagGaugeRange === "earth" ||
      input.bmm350MagGaugeRange === "wide" ||
      input.bmm350MagGaugeRange === "auto"
        ? input.bmm350MagGaugeRange
        : getDefaults().bmm350MagGaugeRange,
    bmi270FusionQuatShowNorm:
      typeof input.bmi270FusionQuatShowNorm === "boolean"
        ? input.bmi270FusionQuatShowNorm
        : getDefaults().bmi270FusionQuatShowNorm,
    bmi270FusionQuatPreferPositiveW:
      typeof input.bmi270FusionQuatPreferPositiveW === "boolean"
        ? input.bmi270FusionQuatPreferPositiveW
        : getDefaults().bmi270FusionQuatPreferPositiveW,
    dps368PressureDisplayUnit:
      input.dps368PressureDisplayUnit === "hpa" ||
      input.dps368PressureDisplayUnit === "kpa" ||
      input.dps368PressureDisplayUnit === "pa"
        ? input.dps368PressureDisplayUnit
        : getDefaults().dps368PressureDisplayUnit,
    dps368PressureDisplayFractionDigits:
      input.dps368PressureDisplayFractionDigits === 0 ||
      input.dps368PressureDisplayFractionDigits === 1 ||
      input.dps368PressureDisplayFractionDigits === 2
        ? input.dps368PressureDisplayFractionDigits
        : getDefaults().dps368PressureDisplayFractionDigits,
    dps368PressureGaugeRange:
      input.dps368PressureGaugeRange === "sea-level" ||
      input.dps368PressureGaugeRange === "full" ||
      input.dps368PressureGaugeRange === "auto"
        ? input.dps368PressureGaugeRange
        : getDefaults().dps368PressureGaugeRange,
    autoRecoverStaleSensorDecodeEnabled:
      typeof input.autoRecoverStaleSensorDecodeEnabled === "boolean"
        ? input.autoRecoverStaleSensorDecodeEnabled
        : getDefaults().autoRecoverStaleSensorDecodeEnabled,
    sensorDecodeStaleIntervalMultiplier: clampSensorDecodeStaleIntervalMultiplier(
      input.sensorDecodeStaleIntervalMultiplier,
    ),
    telemetryWedgeDiagnosticLogEnabled:
      typeof input.telemetryWedgeDiagnosticLogEnabled === "boolean"
        ? input.telemetryWedgeDiagnosticLogEnabled
        : getDefaults().telemetryWedgeDiagnosticLogEnabled,
    telemetryDecodeDebugEnabled:
      typeof input.telemetryDecodeDebugEnabled === "boolean"
        ? input.telemetryDecodeDebugEnabled
        : getDefaults().telemetryDecodeDebugEnabled,
    bmi270FusionQuatSpikeRejectEnabled:
      typeof input.bmi270FusionQuatSpikeRejectEnabled === "boolean"
        ? input.bmi270FusionQuatSpikeRejectEnabled
        : getDefaults().bmi270FusionQuatSpikeRejectEnabled,
  };
}

export const useBitstreamConfigStore = create<BitstreamConfigStore>((set) => ({
  ...(() => {
    const defaults = getDefaults();
    const saved = loadSavedConfig();
    const merged = { ...defaults, ...saved } as BitstreamConfigState;
    delete (merged as unknown as Record<string, unknown>).sensorWorkspaceColumnCardOrder;
    merged.bmi270StreamMode = normalizeBmi270StreamMode(merged.bmi270StreamMode);
    merged.bmi270FusionFeedIntervalMs = clampBmi270FusionFeedIntervalMs(merged.bmi270FusionFeedIntervalMs);
    merged.bmi270FusionQuatSpikeRejectEnabled =
      typeof merged.bmi270FusionQuatSpikeRejectEnabled === "boolean"
        ? merged.bmi270FusionQuatSpikeRejectEnabled
        : getDefaults().bmi270FusionQuatSpikeRejectEnabled;
    merged.firmwareLogLevelUi = Math.max(0, Math.min(5, Math.round(merged.firmwareLogLevelUi)));
    merged.commandConfirmationMode =
      merged.commandConfirmationMode === "auto" ||
      merged.commandConfirmationMode === "reliable" ||
      merged.commandConfirmationMode === "fast"
        ? merged.commandConfirmationMode
        : "auto";
    merged.uiFlushIntervalMs = clampUiFlushIntervalMs(merged.uiFlushIntervalMs);
    merged.autoRecoverStaleSensorDecodeEnabled =
      typeof merged.autoRecoverStaleSensorDecodeEnabled === "boolean"
        ? merged.autoRecoverStaleSensorDecodeEnabled
        : getDefaults().autoRecoverStaleSensorDecodeEnabled;
    merged.sensorDecodeStaleIntervalMultiplier = clampSensorDecodeStaleIntervalMultiplier(
      merged.sensorDecodeStaleIntervalMultiplier,
    );
    merged.telemetryWedgeDiagnosticLogEnabled =
      typeof merged.telemetryWedgeDiagnosticLogEnabled === "boolean"
        ? merged.telemetryWedgeDiagnosticLogEnabled
        : getDefaults().telemetryWedgeDiagnosticLogEnabled;
    merged.telemetryDecodeDebugEnabled =
      typeof merged.telemetryDecodeDebugEnabled === "boolean"
        ? merged.telemetryDecodeDebugEnabled
        : getDefaults().telemetryDecodeDebugEnabled;
    merged.bs2AutoConnectOnStartup =
      typeof merged.bs2AutoConnectOnStartup === "boolean"
        ? merged.bs2AutoConnectOnStartup
        : getDefaults().bs2AutoConnectOnStartup;
    const normalizedBaud = normalizeBitstreamBaudRateText(merged.baudRateText);
    if (normalizedBaud !== merged.baudRateText) {
      merged.baudRateText = normalizedBaud;
    }
    const normalizedFields = normalizeSensorTelemetryFields(merged);
    if (normalizedBaud !== saved?.baudRateText) {
      saveConfig(normalizedFields);
    }
    return normalizedFields;
  })(),

  setWsUrl: (value) =>
    set((state) => {
      const next = { ...state, wsUrl: value };
      saveConfig(next);
      return { wsUrl: value };
    }),
  setSerialPath: (value) =>
    set((state) => {
      const next = { ...state, serialPath: value };
      saveConfig(next);
      return { serialPath: value };
    }),
  setSerialPortDisplayOrder: (paths) =>
    set((state) => {
      const serialPortDisplayOrder = Array.from(
        new Set(paths.map((item) => item.trim()).filter((item) => item.length > 0)),
      );
      const prev = state.serialPortDisplayOrder;
      const same =
        prev.length === serialPortDisplayOrder.length &&
        prev.every((item, index) => item === serialPortDisplayOrder[index]);
      if (same) {
        return {};
      }
      const next = { ...state, serialPortDisplayOrder };
      saveConfig(next);
      return { serialPortDisplayOrder };
    }),
  syncSerialPortDisplayOrderWithAvailable: (availablePaths) =>
    set((state) => {
      const normalized = availablePaths.map((item) => item.trim()).filter((item) => item.length > 0);
      const availableSet = new Set(normalized);
      const retained = state.serialPortDisplayOrder.filter((path) => availableSet.has(path));
      const appended = normalized.filter((path) => !retained.includes(path));
      const serialPortDisplayOrder = [...retained, ...appended];
      const prev = state.serialPortDisplayOrder;
      const same =
        prev.length === serialPortDisplayOrder.length &&
        prev.every((item, index) => item === serialPortDisplayOrder[index]);
      if (same) {
        return {};
      }
      const next = { ...state, serialPortDisplayOrder };
      saveConfig(next);
      return { serialPortDisplayOrder };
    }),
  toggleWhitelistedSerialPath: (path) =>
    set((state) => {
      const normalized = path.trim();
      if (!normalized) {
        return {};
      }
      const exists = state.whitelistedSerialPaths.includes(normalized);
      const whitelistedSerialPaths = exists
        ? state.whitelistedSerialPaths.filter((item) => item !== normalized)
        : [...state.whitelistedSerialPaths, normalized];
      const next = { ...state, whitelistedSerialPaths };
      saveConfig(next);
      return { whitelistedSerialPaths };
    }),
  setWhitelistedSerialPaths: (paths) =>
    set((state) => {
      const deduped = Array.from(new Set(paths.map((item) => item.trim()).filter((item) => item.length > 0)));
      const next = { ...state, whitelistedSerialPaths: deduped };
      saveConfig(next);
      return { whitelistedSerialPaths: deduped };
    }),
  setBaudRateText: (value) =>
    set((state) => {
      const normalized = normalizeBitstreamBaudRateText(value);
      const next = { ...state, baudRateText: normalized };
      saveConfig(next);
      return { baudRateText: normalized };
    }),
  setUiFlushIntervalMs: (value) =>
    set((state) => {
      const normalized = clampUiFlushIntervalMs(value);
      const next = { ...state, uiFlushIntervalMs: normalized };
      saveConfig(next);
      return { uiFlushIntervalMs: normalized };
    }),
  setBmi270StreamMode: (value) =>
    set((state) => {
      const normalized = normalizeBmi270StreamMode(value);
      const next = { ...state, bmi270StreamMode: normalized };
      saveConfig(next);
      return { bmi270StreamMode: normalized };
    }),
  setBmi270FusionFeedIntervalMs: (value) =>
    set((state) => {
      const normalized = clampBmi270FusionFeedIntervalMs(value);
      const next = { ...state, bmi270FusionFeedIntervalMs: normalized };
      saveConfig(next);
      return { bmi270FusionFeedIntervalMs: normalized };
    }),
  setBmi270FusionQuatSpikeRejectEnabled: (value) =>
    set((state) => {
      const next = {
        ...state,
        bmi270FusionQuatSpikeRejectEnabled: Boolean(value),
      };
      saveConfig(next);
      return {
        bmi270FusionQuatSpikeRejectEnabled: next.bmi270FusionQuatSpikeRejectEnabled,
      };
    }),
  setFirmwareLogLevelUi: (value) =>
    set((state) => {
      const normalized = Math.max(0, Math.min(5, Math.round(value)));
      const next = { ...state, firmwareLogLevelUi: normalized };
      saveConfig(next);
      return { firmwareLogLevelUi: normalized };
    }),
  setCommandConfirmationMode: (value) =>
    set((state) => {
      const normalized = value === "reliable" || value === "fast" ? value : "auto";
      const next = { ...state, commandConfirmationMode: normalized };
      saveConfig(next);
      return { commandConfirmationMode: normalized };
    }),
  setFirmwareLogLevelAutoEnabled: (value) =>
    set((state) => {
      const next = { ...state, firmwareLogLevelAutoEnabled: Boolean(value) };
      saveConfig(next);
      return { firmwareLogLevelAutoEnabled: next.firmwareLogLevelAutoEnabled };
    }),
  setFirmwareLogLevelUserLocked: (value) =>
    set((state) => {
      const next = { ...state, firmwareLogLevelUserLocked: Boolean(value) };
      saveConfig(next);
      return { firmwareLogLevelUserLocked: next.firmwareLogLevelUserLocked };
    }),
  setDiagMajorText: (value) =>
    set((state) => {
      const next = { ...state, diagMajorText: value };
      saveConfig(next);
      return { diagMajorText: value };
    }),
  setDiagMinorText: (value) =>
    set((state) => {
      const next = { ...state, diagMinorText: value };
      saveConfig(next);
      return { diagMinorText: value };
    }),
  setDiagGlobalPeriodText: (value) =>
    set((state) => {
      const next = { ...state, diagGlobalPeriodText: value };
      saveConfig(next);
      return { diagGlobalPeriodText: value };
    }),
  setDiagTaskPeriodText: (value) =>
    set((state) => {
      const next = { ...state, diagTaskPeriodText: value };
      saveConfig(next);
      return { diagTaskPeriodText: value };
    }),

  setSensorTelemetryValueTweenEnabled: (value) =>
    set((state) => {
      const next = { ...state, sensorTelemetryValueTweenEnabled: value };
      saveConfig(next);
      return { sensorTelemetryValueTweenEnabled: value };
    }),
  setSensorTelemetryValueTweenEase: (value) =>
    set((state) => {
      const normalized = normalizeSensorTelemetryTweenEase(value);
      const next = { ...state, sensorTelemetryValueTweenEase: normalized };
      saveConfig(next);
      return { sensorTelemetryValueTweenEase: normalized };
    }),
  setSensorTelemetryInterpolationThresholdMs: (value) =>
    set((state) => {
      const normalized = clampSensorTelemetryInterpolationThresholdMs(value);
      const next = { ...state, sensorTelemetryInterpolationThresholdMs: normalized };
      saveConfig(next);
      return { sensorTelemetryInterpolationThresholdMs: normalized };
    }),
  setSensorTelemetryInterpolationMinMs: (value) =>
    set((state) => {
      const clamped = clampSensorTelemetryInterpolationMinMs(value);
      const pair = clampInterpolationMinMaxPair(clamped, state.sensorTelemetryInterpolationMaxMs);
      const next = {
        ...state,
        sensorTelemetryInterpolationMinMs: pair.minMs,
        sensorTelemetryInterpolationMaxMs: pair.maxMs,
      };
      saveConfig(next);
      return {
        sensorTelemetryInterpolationMinMs: pair.minMs,
        sensorTelemetryInterpolationMaxMs: pair.maxMs,
      };
    }),
  setSensorTelemetryInterpolationMaxMs: (value) =>
    set((state) => {
      const clamped = clampSensorTelemetryInterpolationMaxMs(value);
      const pair = clampInterpolationMinMaxPair(state.sensorTelemetryInterpolationMinMs, clamped);
      const next = {
        ...state,
        sensorTelemetryInterpolationMinMs: pair.minMs,
        sensorTelemetryInterpolationMaxMs: pair.maxMs,
      };
      saveConfig(next);
      return {
        sensorTelemetryInterpolationMinMs: pair.minMs,
        sensorTelemetryInterpolationMaxMs: pair.maxMs,
      };
    }),
  setSensorTelemetryIconPulseEnabled: (value) =>
    set((state) => {
      const next = { ...state, sensorTelemetryIconPulseEnabled: value };
      saveConfig(next);
      return { sensorTelemetryIconPulseEnabled: value };
    }),
  setSensorTelemetryIconPulseThrottleMs: (value) =>
    set((state) => {
      const normalized = clampSensorTelemetryIconPulseThrottleMs(value);
      const next = { ...state, sensorTelemetryIconPulseThrottleMs: normalized };
      saveConfig(next);
      return { sensorTelemetryIconPulseThrottleMs: normalized };
    }),
  setSensorTelemetryIconPulseIntensityPreset: (value) =>
    set((state) => {
      const normalized = normalizeSensorTelemetryIconPulseIntensityPreset(value);
      const next = { ...state, sensorTelemetryIconPulseIntensityPreset: normalized };
      saveConfig(next);
      return { sensorTelemetryIconPulseIntensityPreset: normalized };
    }),
    setSensorTelemetryIconPulsePeakColorHex: (value) =>
    set((state) => {
      const normalized = normalizeSensorTelemetryIconPulsePeakColorHex(value);
      const next = { ...state, sensorTelemetryIconPulsePeakColorHex: normalized };
      saveConfig(next);
      return { sensorTelemetryIconPulsePeakColorHex: normalized };
    }),
  setSensorTelemetryIconPulseAnimationPreset: (value) =>
    set((state) => {
      const normalized = normalizeSensorTelemetryIconPulseAnimationPreset(value);
      const next = { ...state, sensorTelemetryIconPulseAnimationPreset: normalized };
      saveConfig(next);
      return { sensorTelemetryIconPulseAnimationPreset: normalized };
    }),
  setSensorTelemetryIconPulseColorAnimationEnabled: (value) =>
    set((state) => {
      const next = { ...state, sensorTelemetryIconPulseColorAnimationEnabled: value };
      saveConfig(next);
      return { sensorTelemetryIconPulseColorAnimationEnabled: value };
    }),

  setFusionUpdateDeltaWarnMultiplier: (value) =>
    set((state) => {
      const warn = clampFusionUpdateDeltaMultiplier(value, state.fusionUpdateDeltaWarnMultiplier);
      const bad = Math.max(state.fusionUpdateDeltaBadMultiplier, warn + 0.05);
      const next = { ...state, fusionUpdateDeltaWarnMultiplier: warn, fusionUpdateDeltaBadMultiplier: bad };
      saveConfig(next);
      return { fusionUpdateDeltaWarnMultiplier: warn, fusionUpdateDeltaBadMultiplier: bad };
    }),
  setFusionUpdateDeltaBadMultiplier: (value) =>
    set((state) => {
      const warn = state.fusionUpdateDeltaWarnMultiplier;
      const bad = Math.max(
        clampFusionUpdateDeltaMultiplier(value, state.fusionUpdateDeltaBadMultiplier),
        warn + 0.05,
      );
      const next = { ...state, fusionUpdateDeltaBadMultiplier: bad };
      saveConfig(next);
      return { fusionUpdateDeltaBadMultiplier: bad };
    }),
  setFusionUpdateDeltaUseRamp: (value) =>
    set((state) => {
      const next = { ...state, fusionUpdateDeltaUseRamp: Boolean(value) };
      saveConfig(next);
      return { fusionUpdateDeltaUseRamp: next.fusionUpdateDeltaUseRamp };
    }),
  setFusionUpdateDeltaGoodColorHex: (value) =>
    set((state) => {
      const normalized = normalizeHexColor(value, state.fusionUpdateDeltaGoodColorHex);
      const next = { ...state, fusionUpdateDeltaGoodColorHex: normalized };
      saveConfig(next);
      return { fusionUpdateDeltaGoodColorHex: normalized };
    }),
  setFusionUpdateDeltaWarnColorHex: (value) =>
    set((state) => {
      const normalized = normalizeHexColor(value, state.fusionUpdateDeltaWarnColorHex);
      const next = { ...state, fusionUpdateDeltaWarnColorHex: normalized };
      saveConfig(next);
      return { fusionUpdateDeltaWarnColorHex: normalized };
    }),
  setFusionUpdateDeltaBadColorHex: (value) =>
    set((state) => {
      const normalized = normalizeHexColor(value, state.fusionUpdateDeltaBadColorHex);
      const next = { ...state, fusionUpdateDeltaBadColorHex: normalized };
      saveConfig(next);
      return { fusionUpdateDeltaBadColorHex: normalized };
    }),
  setTelemetryUpdateBadgeMode: (value) =>
    set((state) => {
      const normalized =
        value === "both" || value === "timestamp" || value === "delta" || value === "off"
          ? value
          : state.telemetryUpdateBadgeMode;
      const next = { ...state, telemetryUpdateBadgeMode: normalized };
      saveConfig(next);
      return { telemetryUpdateBadgeMode: normalized };
    }),
  setTelemetryUpdateDeltaSource: (value) =>
    set((state) => {
      const normalized =
        value === "device" || value === "host" || value === "both"
          ? value
          : state.telemetryUpdateDeltaSource;
      const next = { ...state, telemetryUpdateDeltaSource: normalized };
      saveConfig(next);
      return { telemetryUpdateDeltaSource: normalized };
    }),
  setTelemetryMetaDisplayMode: (value) =>
    set((state) => {
      const normalized =
        value === "counter" || value === "hz" || value === "both"
          ? value
          : state.telemetryMetaDisplayMode;
      const next = { ...state, telemetryMetaDisplayMode: normalized };
      saveConfig(next);
      return { telemetryMetaDisplayMode: normalized };
    }),
  setTelemetryMetaRateSource: (value) =>
    set((state) => {
      const normalized =
        value === "device" ||
        value === "host" ||
        value === "counter" ||
        value === "smoothed"
          ? value
          : state.telemetryMetaRateSource;
      const next = { ...state, telemetryMetaRateSource: normalized };
      saveConfig(next);
      return { telemetryMetaRateSource: normalized };
    }),
  setBmi270FusionEulerDisplayMode: (value) =>
    set((state) => {
      const normalized =
        value === "signed-pi-rad" ||
        value === "signed-deg" ||
        value === "unsigned-deg"
          ? value
          : state.bmi270FusionEulerDisplayMode;
      const next = { ...state, bmi270FusionEulerDisplayMode: normalized };
      saveConfig(next);
      return { bmi270FusionEulerDisplayMode: normalized };
    }),
  setTemperatureDisplayUnit: (value) =>
    set((state) => {
      const normalized = value === "c" || value === "f" || value === "k"
        ? value
        : state.temperatureDisplayUnit;
      const next = { ...state, temperatureDisplayUnit: normalized };
      saveConfig(next);
      return { temperatureDisplayUnit: normalized };
    }),
  setTemperatureDisplayFractionDigits: (value) =>
    set((state) => {
      const normalized = value === 0 || value === 1 || value === 2
        ? value
        : state.temperatureDisplayFractionDigits;
      const next = { ...state, temperatureDisplayFractionDigits: normalized };
      saveConfig(next);
      return { temperatureDisplayFractionDigits: normalized };
    }),
  setBmm350MagShowMagnitude: (value) =>
    set((state) => {
      const next = { ...state, bmm350MagShowMagnitude: Boolean(value) };
      saveConfig(next);
      return { bmm350MagShowMagnitude: next.bmm350MagShowMagnitude };
    }),
  setBmm350MagGaugeRange: (value) =>
    set((state) => {
      const normalized =
        value === "earth" || value === "wide" || value === "auto"
          ? value
          : state.bmm350MagGaugeRange;
      const next = { ...state, bmm350MagGaugeRange: normalized };
      saveConfig(next);
      return { bmm350MagGaugeRange: normalized };
    }),
  setBmi270FusionQuatShowNorm: (value) =>
    set((state) => {
      const next = { ...state, bmi270FusionQuatShowNorm: Boolean(value) };
      saveConfig(next);
      return { bmi270FusionQuatShowNorm: next.bmi270FusionQuatShowNorm };
    }),
  setBmi270FusionQuatPreferPositiveW: (value) =>
    set((state) => {
      const next = { ...state, bmi270FusionQuatPreferPositiveW: Boolean(value) };
      saveConfig(next);
      return { bmi270FusionQuatPreferPositiveW: next.bmi270FusionQuatPreferPositiveW };
    }),
  setDps368PressureDisplayUnit: (value) =>
    set((state) => {
      const normalized =
        value === "hpa" || value === "kpa" || value === "pa"
          ? value
          : state.dps368PressureDisplayUnit;
      const next = { ...state, dps368PressureDisplayUnit: normalized };
      saveConfig(next);
      return { dps368PressureDisplayUnit: normalized };
    }),
  setDps368PressureDisplayFractionDigits: (value) =>
    set((state) => {
      const normalized = value === 0 || value === 1 || value === 2
        ? value
        : state.dps368PressureDisplayFractionDigits;
      const next = { ...state, dps368PressureDisplayFractionDigits: normalized };
      saveConfig(next);
      return { dps368PressureDisplayFractionDigits: normalized };
    }),
  setDps368PressureGaugeRange: (value) =>
    set((state) => {
      const normalized =
        value === "sea-level" || value === "full" || value === "auto"
          ? value
          : state.dps368PressureGaugeRange;
      const next = { ...state, dps368PressureGaugeRange: normalized };
      saveConfig(next);
      return { dps368PressureGaugeRange: normalized };
    }),
  setAutoRecoverStaleSensorDecodeEnabled: (value) =>
    set((state) => {
      const next = { ...state, autoRecoverStaleSensorDecodeEnabled: Boolean(value) };
      saveConfig(next);
      return {
        autoRecoverStaleSensorDecodeEnabled: next.autoRecoverStaleSensorDecodeEnabled,
      };
    }),
  setSensorDecodeStaleIntervalMultiplier: (value) =>
    set((state) => {
      const normalized = clampSensorDecodeStaleIntervalMultiplier(value);
      const next = { ...state, sensorDecodeStaleIntervalMultiplier: normalized };
      saveConfig(next);
      return { sensorDecodeStaleIntervalMultiplier: normalized };
    }),
  setTelemetryWedgeDiagnosticLogEnabled: (value) =>
    set((state) => {
      const next = { ...state, telemetryWedgeDiagnosticLogEnabled: Boolean(value) };
      saveConfig(next);
      return { telemetryWedgeDiagnosticLogEnabled: next.telemetryWedgeDiagnosticLogEnabled };
    }),
  setTelemetryDecodeDebugEnabled: (value) =>
    set((state) => {
      const next = { ...state, telemetryDecodeDebugEnabled: Boolean(value) };
      saveConfig(next);
      return { telemetryDecodeDebugEnabled: next.telemetryDecodeDebugEnabled };
    }),
  setBs2AutoConnectOnStartup: (value) =>
    set((state) => {
      const next = { ...state, bs2AutoConnectOnStartup: Boolean(value) };
      saveConfig(next);
      return { bs2AutoConnectOnStartup: next.bs2AutoConnectOnStartup };
    }),

  mergeHostOverlay: (raw) =>
    set((state) => {
      const patch = parseConfigOverlay(raw);
      if (Object.keys(patch).length === 0) {
        return {};
      }
      const next: BitstreamConfigState = normalizeSensorTelemetryFields({
        wsUrl: patch.wsUrl ?? state.wsUrl,
        serialPath: patch.serialPath ?? state.serialPath,
        serialPortDisplayOrder: patch.serialPortDisplayOrder ?? state.serialPortDisplayOrder,
        whitelistedSerialPaths: patch.whitelistedSerialPaths ?? state.whitelistedSerialPaths,
        baudRateText: patch.baudRateText ?? state.baudRateText,
        uiFlushIntervalMs: patch.uiFlushIntervalMs ?? state.uiFlushIntervalMs,
        bmi270StreamMode: normalizeBmi270StreamMode(
          patch.bmi270StreamMode ?? state.bmi270StreamMode,
        ),
        bmi270FusionFeedIntervalMs: clampBmi270FusionFeedIntervalMs(
          patch.bmi270FusionFeedIntervalMs ?? state.bmi270FusionFeedIntervalMs,
        ),
        bmi270FusionQuatSpikeRejectEnabled: (() => {
          const v = (patch as Partial<BitstreamConfigState>).bmi270FusionQuatSpikeRejectEnabled;
          return typeof v === "boolean" ? v : state.bmi270FusionQuatSpikeRejectEnabled;
        })(),
        firmwareLogLevelUi: Math.max(
          0,
          Math.min(5, Math.round(patch.firmwareLogLevelUi ?? state.firmwareLogLevelUi)),
        ),
        firmwareLogLevelAutoEnabled: (() => {
          const v = (patch as Partial<BitstreamConfigState>).firmwareLogLevelAutoEnabled;
          return typeof v === "boolean" ? v : state.firmwareLogLevelAutoEnabled;
        })(),
        firmwareLogLevelUserLocked: (() => {
          const v = (patch as Partial<BitstreamConfigState>).firmwareLogLevelUserLocked;
          return typeof v === "boolean" ? v : state.firmwareLogLevelUserLocked;
        })(),
        diagMajorText: patch.diagMajorText ?? state.diagMajorText,
        diagMinorText: patch.diagMinorText ?? state.diagMinorText,
        diagGlobalPeriodText: patch.diagGlobalPeriodText ?? state.diagGlobalPeriodText,
        diagTaskPeriodText: patch.diagTaskPeriodText ?? state.diagTaskPeriodText,
        sensorTelemetryValueTweenEnabled:
          patch.sensorTelemetryValueTweenEnabled ?? state.sensorTelemetryValueTweenEnabled,
        sensorTelemetryValueTweenEase: normalizeSensorTelemetryTweenEase(
          patch.sensorTelemetryValueTweenEase ?? state.sensorTelemetryValueTweenEase,
        ),
        sensorTelemetryInterpolationThresholdMs:
          patch.sensorTelemetryInterpolationThresholdMs ??
          state.sensorTelemetryInterpolationThresholdMs,
        sensorTelemetryInterpolationMinMs:
          patch.sensorTelemetryInterpolationMinMs ?? state.sensorTelemetryInterpolationMinMs,
        sensorTelemetryInterpolationMaxMs:
          patch.sensorTelemetryInterpolationMaxMs ?? state.sensorTelemetryInterpolationMaxMs,
        sensorTelemetryIconPulseEnabled:
          patch.sensorTelemetryIconPulseEnabled ?? state.sensorTelemetryIconPulseEnabled,
        sensorTelemetryIconPulseThrottleMs:
          patch.sensorTelemetryIconPulseThrottleMs ?? state.sensorTelemetryIconPulseThrottleMs,
        sensorTelemetryIconPulseIntensityPreset:
          patch.sensorTelemetryIconPulseIntensityPreset ??
          state.sensorTelemetryIconPulseIntensityPreset,
        sensorTelemetryIconPulsePeakColorHex:
          patch.sensorTelemetryIconPulsePeakColorHex ?? state.sensorTelemetryIconPulsePeakColorHex,
        sensorTelemetryIconPulseAnimationPreset:
          patch.sensorTelemetryIconPulseAnimationPreset ??
          state.sensorTelemetryIconPulseAnimationPreset,
        sensorTelemetryIconPulseColorAnimationEnabled:
          patch.sensorTelemetryIconPulseColorAnimationEnabled ??
          state.sensorTelemetryIconPulseColorAnimationEnabled,
        fusionUpdateDeltaWarnMultiplier:
          patch.fusionUpdateDeltaWarnMultiplier ?? state.fusionUpdateDeltaWarnMultiplier,
        fusionUpdateDeltaBadMultiplier:
          patch.fusionUpdateDeltaBadMultiplier ?? state.fusionUpdateDeltaBadMultiplier,
        fusionUpdateDeltaUseRamp: patch.fusionUpdateDeltaUseRamp ?? state.fusionUpdateDeltaUseRamp,
        fusionUpdateDeltaGoodColorHex:
          patch.fusionUpdateDeltaGoodColorHex ?? state.fusionUpdateDeltaGoodColorHex,
        fusionUpdateDeltaWarnColorHex:
          patch.fusionUpdateDeltaWarnColorHex ?? state.fusionUpdateDeltaWarnColorHex,
        fusionUpdateDeltaBadColorHex:
          patch.fusionUpdateDeltaBadColorHex ?? state.fusionUpdateDeltaBadColorHex,
        telemetryUpdateBadgeMode:
          patch.telemetryUpdateBadgeMode ?? state.telemetryUpdateBadgeMode,
        telemetryUpdateDeltaSource:
          patch.telemetryUpdateDeltaSource ?? state.telemetryUpdateDeltaSource,
        telemetryMetaDisplayMode:
          patch.telemetryMetaDisplayMode ?? state.telemetryMetaDisplayMode,
        telemetryMetaRateSource:
          patch.telemetryMetaRateSource ?? state.telemetryMetaRateSource,
        bmi270FusionEulerDisplayMode:
          patch.bmi270FusionEulerDisplayMode ?? state.bmi270FusionEulerDisplayMode,
        temperatureDisplayUnit:
          patch.temperatureDisplayUnit ?? state.temperatureDisplayUnit,
        temperatureDisplayFractionDigits:
          patch.temperatureDisplayFractionDigits ?? state.temperatureDisplayFractionDigits,
        bmm350MagShowMagnitude:
          patch.bmm350MagShowMagnitude ?? state.bmm350MagShowMagnitude,
        bmm350MagGaugeRange: patch.bmm350MagGaugeRange ?? state.bmm350MagGaugeRange,
        bmi270FusionQuatShowNorm:
          patch.bmi270FusionQuatShowNorm ?? state.bmi270FusionQuatShowNorm,
        bmi270FusionQuatPreferPositiveW:
          patch.bmi270FusionQuatPreferPositiveW ?? state.bmi270FusionQuatPreferPositiveW,
        dps368PressureDisplayUnit:
          patch.dps368PressureDisplayUnit ?? state.dps368PressureDisplayUnit,
        dps368PressureDisplayFractionDigits:
          patch.dps368PressureDisplayFractionDigits ?? state.dps368PressureDisplayFractionDigits,
        dps368PressureGaugeRange:
          patch.dps368PressureGaugeRange ?? state.dps368PressureGaugeRange,
        autoRecoverStaleSensorDecodeEnabled: (() => {
          const v = (patch as Partial<BitstreamConfigState>).autoRecoverStaleSensorDecodeEnabled;
          return typeof v === "boolean" ? v : state.autoRecoverStaleSensorDecodeEnabled;
        })(),
        sensorDecodeStaleIntervalMultiplier: clampSensorDecodeStaleIntervalMultiplier(
          patch.sensorDecodeStaleIntervalMultiplier ?? state.sensorDecodeStaleIntervalMultiplier,
        ),
        telemetryWedgeDiagnosticLogEnabled: (() => {
          const v = (patch as Partial<BitstreamConfigState>).telemetryWedgeDiagnosticLogEnabled;
          return typeof v === "boolean" ? v : state.telemetryWedgeDiagnosticLogEnabled;
        })(),
        telemetryDecodeDebugEnabled: (() => {
          const v = (patch as Partial<BitstreamConfigState>).telemetryDecodeDebugEnabled;
          return typeof v === "boolean" ? v : state.telemetryDecodeDebugEnabled;
        })(),
      });
      if (serializePersistedBitstreamConfig(next) === serializePersistedBitstreamConfig(state)) {
        return {};
      }
      saveConfig(next);
      return {
        wsUrl: next.wsUrl,
        serialPath: next.serialPath,
        serialPortDisplayOrder: next.serialPortDisplayOrder,
        whitelistedSerialPaths: next.whitelistedSerialPaths,
        baudRateText: next.baudRateText,
        uiFlushIntervalMs: next.uiFlushIntervalMs,
        bmi270StreamMode: next.bmi270StreamMode,
        bmi270FusionFeedIntervalMs: next.bmi270FusionFeedIntervalMs,
        bmi270FusionQuatSpikeRejectEnabled: next.bmi270FusionQuatSpikeRejectEnabled,
        firmwareLogLevelUi: next.firmwareLogLevelUi,
        firmwareLogLevelAutoEnabled: next.firmwareLogLevelAutoEnabled,
        firmwareLogLevelUserLocked: next.firmwareLogLevelUserLocked,
        diagMajorText: next.diagMajorText,
        diagMinorText: next.diagMinorText,
        diagGlobalPeriodText: next.diagGlobalPeriodText,
        diagTaskPeriodText: next.diagTaskPeriodText,
        sensorTelemetryValueTweenEnabled: next.sensorTelemetryValueTweenEnabled,
        sensorTelemetryValueTweenEase: next.sensorTelemetryValueTweenEase,
        sensorTelemetryInterpolationThresholdMs: next.sensorTelemetryInterpolationThresholdMs,
        sensorTelemetryInterpolationMinMs: next.sensorTelemetryInterpolationMinMs,
        sensorTelemetryInterpolationMaxMs: next.sensorTelemetryInterpolationMaxMs,
        sensorTelemetryIconPulseEnabled: next.sensorTelemetryIconPulseEnabled,
        sensorTelemetryIconPulseThrottleMs: next.sensorTelemetryIconPulseThrottleMs,
        sensorTelemetryIconPulseIntensityPreset: next.sensorTelemetryIconPulseIntensityPreset,
        sensorTelemetryIconPulsePeakColorHex: next.sensorTelemetryIconPulsePeakColorHex,
        sensorTelemetryIconPulseAnimationPreset: next.sensorTelemetryIconPulseAnimationPreset,
        sensorTelemetryIconPulseColorAnimationEnabled: next.sensorTelemetryIconPulseColorAnimationEnabled,
        fusionUpdateDeltaWarnMultiplier: next.fusionUpdateDeltaWarnMultiplier,
        fusionUpdateDeltaBadMultiplier: next.fusionUpdateDeltaBadMultiplier,
        fusionUpdateDeltaUseRamp: next.fusionUpdateDeltaUseRamp,
        fusionUpdateDeltaGoodColorHex: next.fusionUpdateDeltaGoodColorHex,
        fusionUpdateDeltaWarnColorHex: next.fusionUpdateDeltaWarnColorHex,
        fusionUpdateDeltaBadColorHex: next.fusionUpdateDeltaBadColorHex,
        telemetryUpdateBadgeMode: next.telemetryUpdateBadgeMode,
        telemetryUpdateDeltaSource: next.telemetryUpdateDeltaSource,
        telemetryMetaDisplayMode: next.telemetryMetaDisplayMode,
        telemetryMetaRateSource: next.telemetryMetaRateSource,
        bmi270FusionEulerDisplayMode: next.bmi270FusionEulerDisplayMode,
        temperatureDisplayUnit: next.temperatureDisplayUnit,
        temperatureDisplayFractionDigits: next.temperatureDisplayFractionDigits,
        bmm350MagShowMagnitude: next.bmm350MagShowMagnitude,
        bmm350MagGaugeRange: next.bmm350MagGaugeRange,
        bmi270FusionQuatShowNorm: next.bmi270FusionQuatShowNorm,
        bmi270FusionQuatPreferPositiveW: next.bmi270FusionQuatPreferPositiveW,
        dps368PressureDisplayUnit: next.dps368PressureDisplayUnit,
        dps368PressureDisplayFractionDigits: next.dps368PressureDisplayFractionDigits,
        dps368PressureGaugeRange: next.dps368PressureGaugeRange,
        autoRecoverStaleSensorDecodeEnabled: next.autoRecoverStaleSensorDecodeEnabled,
        sensorDecodeStaleIntervalMultiplier: next.sensorDecodeStaleIntervalMultiplier,
        telemetryWedgeDiagnosticLogEnabled: next.telemetryWedgeDiagnosticLogEnabled,
        telemetryDecodeDebugEnabled: next.telemetryDecodeDebugEnabled,
      };
    }),
}));
