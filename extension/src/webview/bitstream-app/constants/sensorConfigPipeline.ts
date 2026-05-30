/** Wall-clock budget for one full `sensor.cfg` get → set → verify pipeline. */
export const SENSOR_CFG_PIPELINE_TIMEOUT_MS = 25_000;

/** Wall-clock budget for `sensor.bmi270.mode.set` round-trip. */
// Interactive UI: keep this close to the backend ACK budget (8s + 1 retry + overhead),
// otherwise the UI stays stuck in "ACK pending" for too long after a real firmware miss.
export const BMI270_MODE_COMMAND_TIMEOUT_MS = 12_000;
