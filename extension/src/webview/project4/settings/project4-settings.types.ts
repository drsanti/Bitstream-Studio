/** Persisted under `ternion.project4.settings.v1` — see PROJECT_INFO.md § Application settings. */

/** Derived from `mcuBaseUrl` during normalize (stored for readability / export parity with UI badges). */
export type Project4McuConnectionPreset = "mock" | "real" | "custom";

export type Project4SettingsState = {
  schemaVersion: number;
  mcuBaseUrl: string;
  /** Always recomputed from `mcuBaseUrl` on save — mock vs real preset URLs vs anything else. */
  mcuConnectionPreset: Project4McuConnectionPreset;
  telemetryPath: string;
  movePath: string;
  setSpeedPath: string;
  moveDirQueryKey: string;
  setSpeedValueQueryKey: string;
  telemetryPollIntervalMs: number;
  httpRequestTimeoutMs: number;
  trackWidthM: number;
  wheelbaseM: number;
  wheelRadiusM: number;
  /**
   * **Digital twin setup** — front **`Ultrasonic_F`** viewer yaw offset bounds (deg); remap target after MCU sweep.
   * Does not change MCU JSON.
   */
  scannerFrontAzimuthMinDeg: number;
  scannerFrontAzimuthMaxDeg: number;
  /** **Digital twin setup** — rear **`Ultrasonic_R`** viewer yaw offsets (same rule as front). */
  scannerRearAzimuthMinDeg: number;
  scannerRearAzimuthMaxDeg: number;
  /**
   * **Hardware setup** — min/max degrees **actually emitted** by firmware during scanner pan (see **`project4-mcu-documented-ranges.ts`** + **`PROJECT_INFO.md`** § Status).
   * Encodable range may be wider (**`−180`…`+180`**); this pair is the remap domain into **Digital twin** **`scanner*Azimuth*`**.
   */
  scannerTelemetrySweepMinDeg: number;
  scannerTelemetrySweepMaxDeg: number;
  reverseSafetyStopCmDisplay: number;
  robotModelUrl: string;
  /** Cubemap folder id under `textures/cubemap/<id>/` or **`none`** for flat backdrop — see `PROJECT_INFO.md` § *3D scene environment*. */
  twinCubemapEnvironmentId: string;
  /** When true, append `setSpeedValueQueryKey` as a query param on GET. */
  setSpeedUseQuery: boolean;
};

export type Project4SettingsActions = {
  patchProject4Settings: (partial: Partial<Project4SettingsState>) => void;
  resetProject4Settings: () => void;
  /** Robot geometry + MCU sweep + reverse safety HUD — does not touch Connection / twin viewer arcs / model URL. */
  resetProject4HardwareSetupToDefaults: () => void;
  /** Twin viewer scanner yaw bounds only — does not touch MCU sweep or Connection. */
  resetProject4TwinViewerSetupToDefaults: () => void;
};

export type Project4SettingsStore = Project4SettingsState & Project4SettingsActions;
