export const BS2_SENSOR_ID = {
  BMI270: 0,
  BMM350: 1,
  SHT40: 2,
  DPS368: 3,
} as const;

export type Bs2SensorId = (typeof BS2_SENSOR_ID)[keyof typeof BS2_SENSOR_ID];

