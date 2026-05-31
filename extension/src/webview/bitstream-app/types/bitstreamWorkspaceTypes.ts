import type { Bmi270NumericKey } from "../bmi270/bmi270TelemetryConstants";
import { useBitstreamLive } from "../hooks/useBitstreamLive";

export type Bmi270LiveSample = ReturnType<
  typeof useBitstreamLive
>["latestByHint"]["bmi270"];
export type Dps368LiveSample = ReturnType<
  typeof useBitstreamLive
>["latestByHint"]["dps368"];
export type Sht40LiveSample = ReturnType<
  typeof useBitstreamLive
>["latestByHint"]["sht40"];
export type Bmm350LiveSample = ReturnType<
  typeof useBitstreamLive
>["latestByHint"]["bmm350"];

export type Bmi270ResolvedSample = NonNullable<Bmi270LiveSample>;
/**
 * When BMI270 samples are merged via `mergeBmi270SampleCache`, fusion fields may be retained from
 * the cache even when the *current* incoming frame is raw (Hybrid mode). This flag preserves the
 * payload type of the latest incoming frame so UI can label cached fusion values accurately.
 */
export type Bmi270ResolvedSampleWithFrameFlags = Bmi270ResolvedSample & {
  /** True only when the latest incoming frame was a fusion payload. */
  isBmi270FusionPayloadNow?: boolean;
};

export type SensorPublishMode = 0 | 1 | 2;

export type SensorTelemetryCardId =
  | "meta"
  | "pressure"
  | "dps368Temperature"
  | "sht40Humidity"
  | "sht40Temperature"
  | "bmm350"
  | "bmm350Temperature"
  | "gyro"
  | "accel"
  | "temp"
  | "quat"
  | "euler";

export const DEFAULT_SENSOR_TELEMETRY_CARD_ORDER: SensorTelemetryCardId[] = [
  "meta",
  "pressure",
  "dps368Temperature",
  "sht40Humidity",
  "sht40Temperature",
  "bmm350",
  "bmm350Temperature",
  "gyro",
  "accel",
  "temp",
  "quat",
  "euler",
];

export type Bmi270SampleCacheState = {
  sample: Bmi270ResolvedSampleWithFrameFlags;
  updatedAtByKey: Partial<Record<Bmi270NumericKey, number>>;
  /** Last EVT counter applied — stale TTL runs only when this advances. */
  lastIncomingCounter?: number;
};
