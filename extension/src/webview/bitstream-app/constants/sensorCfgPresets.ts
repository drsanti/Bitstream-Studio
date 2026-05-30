/**
 * Per-sensor preset lists for Bitstream `sensor.cfg` control cards.
 * Values align with default sampling intervals in `bitstreamDeviceSensorConfig.store.ts`
 * and typical sensor resolution / publish rates (firmware clamps min publish ≤ sampling).
 */

export const BMI270_SAMPLING_INTERVAL_PRESETS_MS = [
  10, 15, 20, 25, 50, 100, 150, 250, 500,
] as const;

/** ~0–2× default sampling (25 ms); firmware caps min publish to sampling. */
export const BMI270_MIN_PUBLISH_INTERVAL_PRESETS_MS = [
  0, 10, 25, 50, 100, 250, 500,
] as const;

/** Acc magnitude / temp proxy (×100); UI slider max 50. */
export const BMI270_DELTA_THRESHOLD_PRESETS_X100 = [0, 10, 25, 50] as const;

export const BMM350_SAMPLING_INTERVAL_PRESETS_MS = [
  10, 25, 50, 100, 150, 250, 500, 1000,
] as const;

export const BMM350_MIN_PUBLISH_INTERVAL_PRESETS_MS = [
  0, 25, 50, 100, 250, 500, 1000,
] as const;

/** Mag magnitude proxy (×100). */
export const BMM350_DELTA_THRESHOLD_PRESETS_X100 = [0, 10, 25, 50] as const;

/** Slow RH/T sensor; default sampling 500 ms. */
export const SHT40_SAMPLING_INTERVAL_PRESETS_MS = [
  100, 250, 500, 1000, 2000, 3000,
] as const;

export const SHT40_MIN_PUBLISH_INTERVAL_PRESETS_MS = [
  0, 100, 250, 500, 1000, 2000,
] as const;

/** Temp LSB ~0.5 °C → 50; smaller steps for humidity (×100 %RH). */
export const SHT40_DELTA_THRESHOLD_PRESETS_X100 = [0, 5, 10, 25, 50] as const;

/** Baro sensor; default sampling 1000 ms. */
export const DPS368_SAMPLING_INTERVAL_PRESETS_MS = [
  250, 500, 1000, 2000, 3000,
] as const;

export const DPS368_MIN_PUBLISH_INTERVAL_PRESETS_MS = [
  0, 250, 500, 1000, 2000,
] as const;

/** Pressure / temperature (×100 units in firmware gate). */
export const DPS368_DELTA_THRESHOLD_PRESETS_X100 = [0, 5, 10, 20, 50] as const;
