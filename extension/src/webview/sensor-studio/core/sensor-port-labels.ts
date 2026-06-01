/** Canonical flow socket / catalog / inspector label for die temperature ports. */
export const SENSOR_TEMPERATURE_PORT_LABEL = "Temperature (°C)";

/**
 * Compact temp label — BMI270 hardware node canvas socket, palette rows, BMI270 inspector.
 * Other sensors / taps use {@link SENSOR_TEMPERATURE_PORT_LABEL}.
 */
export const PALETTE_TEMPERATURE_ROW_LABEL = "Temp (°C)";

/** Node palette DPS368 pressure row (unit in label, no trailing unit suffix). */
export const PALETTE_PRESSURE_ROW_LABEL = "Pressure (hPa)";

/** Node palette SHT40 humidity row (unit in label, no trailing unit suffix). */
export const PALETTE_HUMIDITY_ROW_LABEL = "Humidity (%RH)";

/** Node palette BMM350 magnetic vector row (unit in label). */
export const PALETTE_MAGNETIC_ROW_LABEL = "Mag (µT)";

/** Node palette BMI270 vector rows (unit in label). */
export const PALETTE_ACCEL_ROW_LABEL = "Accel (m/s²)";
export const PALETTE_GYRO_ROW_LABEL = "Gyro (rad/s)";
export const PALETTE_EULER_ROW_LABEL = "Euler (rad)";
export const PALETTE_QUATERNION_ROW_LABEL = "Quaternion";
