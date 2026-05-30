export const BMI270_CACHE_TTL_MS = {
  gyro: 1200,
  accel: 1600,
  temp: 4000,
  fusionQuaternion: 3000,
  fusionEuler: 2500,
} as const;

export const BMI270_NUMERIC_KEYS = [
  "temperatureCx100",
  "secondaryX100",
  "magneticXUtX100",
  "magneticYUtX100",
  "magneticZUtX100",
  "accelXMs2X100",
  "accelYMs2X100",
  "accelZMs2X100",
  "gyroXRadSX100",
  "gyroYRadSX100",
  "gyroZRadSX100",
  "fusionQuatWBucketX10000",
  "fusionQuatXX10000",
  "fusionQuatYX10000",
  "fusionQuatZX10000",
  "fusionHeadingRadX100",
  "fusionPitchRadX100",
  "fusionRollRadX100",
] as const;

export type Bmi270NumericKey = (typeof BMI270_NUMERIC_KEYS)[number];

export const BMI270_FIELD_TTL_MS: Record<Bmi270NumericKey, number> = {
  temperatureCx100: BMI270_CACHE_TTL_MS.temp,
  secondaryX100: BMI270_CACHE_TTL_MS.temp,
  magneticXUtX100: BMI270_CACHE_TTL_MS.fusionQuaternion,
  magneticYUtX100: BMI270_CACHE_TTL_MS.fusionQuaternion,
  magneticZUtX100: BMI270_CACHE_TTL_MS.fusionQuaternion,
  accelXMs2X100: BMI270_CACHE_TTL_MS.accel,
  accelYMs2X100: BMI270_CACHE_TTL_MS.accel,
  accelZMs2X100: BMI270_CACHE_TTL_MS.accel,
  gyroXRadSX100: BMI270_CACHE_TTL_MS.gyro,
  gyroYRadSX100: BMI270_CACHE_TTL_MS.gyro,
  gyroZRadSX100: BMI270_CACHE_TTL_MS.gyro,
  fusionQuatWBucketX10000: BMI270_CACHE_TTL_MS.fusionQuaternion,
  fusionQuatXX10000: BMI270_CACHE_TTL_MS.fusionQuaternion,
  fusionQuatYX10000: BMI270_CACHE_TTL_MS.fusionQuaternion,
  fusionQuatZX10000: BMI270_CACHE_TTL_MS.fusionQuaternion,
  fusionHeadingRadX100: BMI270_CACHE_TTL_MS.fusionEuler,
  fusionPitchRadX100: BMI270_CACHE_TTL_MS.fusionEuler,
  fusionRollRadX100: BMI270_CACHE_TTL_MS.fusionEuler,
};
