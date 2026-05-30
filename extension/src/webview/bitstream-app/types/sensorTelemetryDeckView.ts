import type {
  Bmi270LiveSample,
  Bmm350LiveSample,
  Dps368LiveSample,
  Sht40LiveSample,
} from "./bitstreamWorkspaceTypes";

/** Props for `SensorTelemetryDeckView` — BMI270 plus DPS / SHT40 / BMM350 samples and per-source sampling intervals. */
export type SensorTelemetryDeckViewProps = {
  telemetryMeta: {
    dps368StreamCounter: string;
    bmi270StreamCounter: string;
    sht40StreamCounter: string;
    bmm350StreamCounter: string;
    hintDps368: string;
    hintBmi270: string;
    hintSht40: string;
    hintBmm350: string;
    showBmi270StreamCounter: boolean;
    showDps368StreamCounter: boolean;
    showSht40StreamCounter: boolean;
    showBmm350StreamCounter: boolean;
  };
  sample: Bmi270LiveSample;
  dpsSample: Dps368LiveSample;
  sht40Sample: Sht40LiveSample;
  bmm350Sample: Bmm350LiveSample;
  samplingIntervalMs: number;
  dpsSamplingIntervalMs: number;
  shtSamplingIntervalMs: number;
  bmm350SamplingIntervalMs: number;
  /**
   * When false, BMI270-only deck cards (gyro, accel, temp, quat, euler) are hidden; DPS/SHT40/BMM350 stay.
   * Default true.
   */
  bmi270TelemetryEnabled?: boolean;
  /**
   * When false, the DPS368 pressure card is hidden. Default true.
   */
  dps368TelemetryEnabled?: boolean;
  /** When false, the SHT40 deck card is hidden. Default true. */
  sht40TelemetryEnabled?: boolean;
  /** When false, the BMM350 deck card is hidden. Default true. */
  bmm350TelemetryEnabled?: boolean;
};
