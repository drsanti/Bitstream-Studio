import { useMemo, useRef } from "react";
import {
  mergeBmi270SampleCache,
  type Bmi270SampleCacheState,
} from "../../../../../bitstream-app/bmi270/bmi270SampleCache";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../../../../bitstream-app/constants/sensorSourceIds";
import type { Bmi270LiveSample } from "../../../../../bitstream-app/types/bitstreamWorkspaceTypes";
import { useBitstreamLiveStore } from "../../../../../bitstream-app/state/bitstreamLive.store";
import { useBitstreamDeviceSensorConfigStore } from "../../../../../bitstream-app/state/bitstreamDeviceSensorConfig.store";

export type InspectorLiveDeckSamples = {
  bmi270: Bmi270LiveSample | null;
  dps368: unknown;
  sht40: unknown;
  bmm350: unknown;
  samplingIntervalMs: {
    bmi270: number;
    dps368: number;
    sht40: number;
    bmm350: number;
  };
};

/** Same live samples + intervals as Telemetry Data deck (Sensor Studio inspector). */
export function useInspectorLiveDeckSamples(): InspectorLiveDeckSamples {
  const bmi270Raw = useBitstreamLiveStore((s) => s.latestByHint.bmi270);
  const dps368 = useBitstreamLiveStore((s) => s.latestByHint.dps368);
  const sht40 = useBitstreamLiveStore((s) => s.latestByHint.sht40);
  const bmm350 = useBitstreamLiveStore((s) => s.latestByHint.bmm350);
  const bySourceId = useBitstreamDeviceSensorConfigStore((s) => s.bySourceId);

  const bmi270CacheRef = useRef<Bmi270SampleCacheState | null>(null);
  const bmi270 = useMemo(() => {
    bmi270CacheRef.current = mergeBmi270SampleCache(
      bmi270CacheRef.current,
      (bmi270Raw ?? undefined) as Bmi270LiveSample | undefined,
      Date.now(),
    );
    return (bmi270CacheRef.current?.sample ?? null) as Bmi270LiveSample | null;
  }, [bmi270Raw]);

  return useMemo(
    () => ({
      bmi270,
      dps368,
      sht40,
      bmm350,
      samplingIntervalMs: {
        bmi270: bySourceId[SENSOR_SOURCE_ID_BMI270]?.samplingIntervalMs ?? 25,
        dps368: bySourceId[SENSOR_SOURCE_ID_DPS368]?.samplingIntervalMs ?? 1000,
        sht40: bySourceId[SENSOR_SOURCE_ID_SHT40]?.samplingIntervalMs ?? 500,
        bmm350: bySourceId[SENSOR_SOURCE_ID_BMM350]?.samplingIntervalMs ?? 50,
      },
    }),
    [bmi270, bmm350, bySourceId, dps368, sht40],
  );
}
