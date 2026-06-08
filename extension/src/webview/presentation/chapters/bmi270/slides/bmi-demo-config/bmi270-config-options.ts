export type Bmi270DraftConfig = {
  accRange: 2 | 4 | 8 | 16;
  accOdr: 25 | 50 | 100 | 200 | 400 | 800 | 1600;
  gyrRange: 125 | 250 | 500 | 1000 | 2000;
  gyrOdr: 25 | 50 | 100 | 200 | 400 | 800 | 1600;
};

export const BMI270_ACC_RANGES: Bmi270DraftConfig["accRange"][] = [2, 4, 8, 16];
export const BMI270_ACC_ODRS: Bmi270DraftConfig["accOdr"][] = [25, 50, 100, 200, 400, 800, 1600];
export const BMI270_GYR_RANGES: Bmi270DraftConfig["gyrRange"][] = [125, 250, 500, 1000, 2000];
export const BMI270_GYR_ODRS: Bmi270DraftConfig["gyrOdr"][] = [25, 50, 100, 200, 400, 800, 1600];

export function bmi270AccResolutionMgPerLsb(rangeG: Bmi270DraftConfig["accRange"]): number {
  return ((rangeG * 2) / 65536) * 1000;
}

export function bmi270GyrResolutionDegPerLsb(rangeDps: Bmi270DraftConfig["gyrRange"]): number {
  return (rangeDps * 2) / 65536;
}
