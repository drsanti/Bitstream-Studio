import { useRef } from "react";
import {
  mergeBmi270SampleCache,
  finalizeBmi270DeckSample,
} from "../../bitstream-app/bmi270/bmi270SampleCache.js";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../bitstream-app/constants/sensorSourceIds.js";
import { useBitstreamConfigStore } from "../../bitstream-app/state/bitstreamConfig.store.js";
import { useBitstreamDeviceSensorConfigStore } from "../../bitstream-app/state/bitstreamDeviceSensorConfig.store.js";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store.js";
import type { Bmi270SampleCacheState } from "../../bitstream-app/types/bitstreamWorkspaceTypes.js";
import type { CourseSensorTelemetryCardPreset } from "../schemas/sensorTelemetryCardPreset";

function sensorPanelsLive(enabled: boolean | undefined): boolean {
  return enabled ?? true;
}

function isBmi270OnlyPreset(preset: CourseSensorTelemetryCardPreset): boolean {
  return (
    preset === "gyro" ||
    preset === "accel" ||
    preset === "temp" ||
    preset === "quat" ||
    preset === "euler"
  );
}

function isBmi270RawSectionPreset(preset: CourseSensorTelemetryCardPreset): boolean {
  return preset === "gyro" || preset === "accel" || preset === "temp";
}

export function useCourseSensorTelemetryDeckSamples() {
  const latestByHint = useBitstreamLiveStore((s) => s.latestByHint);
  const bySourceId = useBitstreamDeviceSensorConfigStore((s) => s.bySourceId);
  const bmi270StreamMode = useBitstreamConfigStore((s) => s.bmi270StreamMode);

  const bmi270Row = bySourceId[SENSOR_SOURCE_ID_BMI270];
  const dps368Row = bySourceId[SENSOR_SOURCE_ID_DPS368];
  const sht40Row = bySourceId[SENSOR_SOURCE_ID_SHT40];
  const bmm350Row = bySourceId[SENSOR_SOURCE_ID_BMM350];

  const bmi270Sample = latestByHint.bmi270;
  const dps368Sample = latestByHint.dps368;
  const sht40Sample = latestByHint.sht40;
  const bmm350Sample = latestByHint.bmm350;

  const bmi270PanelsLive = sensorPanelsLive(bmi270Row?.enabled);
  const dps368PanelsLive = sensorPanelsLive(dps368Row?.enabled);
  const sht40PanelsLive = sensorPanelsLive(sht40Row?.enabled);
  const bmm350PanelsLive = sensorPanelsLive(bmm350Row?.enabled);

  const bmi270CacheRef = useRef<Bmi270SampleCacheState | null>(null);
  bmi270CacheRef.current = mergeBmi270SampleCache(
    bmi270CacheRef.current,
    bmi270Sample ?? undefined,
    Date.now(),
  );
  const mergedBmi270Sample = finalizeBmi270DeckSample(
    bmi270CacheRef.current?.sample,
    bmi270Sample,
  );

  return {
    bmi270Sample: mergedBmi270Sample,
    dpsSample: dps368Sample,
    sht40Sample,
    bmm350Sample,
    samplingIntervalMs: bmi270Row?.samplingIntervalMs ?? 25,
    dpsSamplingIntervalMs: dps368Row?.samplingIntervalMs ?? 1000,
    shtSamplingIntervalMs: sht40Row?.samplingIntervalMs ?? 500,
    bmm350SamplingIntervalMs: bmm350Row?.samplingIntervalMs ?? 50,
    bmi270TelemetryEnabled: bmi270PanelsLive,
    dps368TelemetryEnabled: dps368PanelsLive,
    sht40TelemetryEnabled: sht40PanelsLive,
    bmm350TelemetryEnabled: bmm350PanelsLive,
    bmi270StreamMode,
  };
}

export function courseSensorTelemetryCardUnavailableReason(
  preset: CourseSensorTelemetryCardPreset,
  ctx: ReturnType<typeof useCourseSensorTelemetryDeckSamples>,
): string | null {
  if (!ctx.bmi270TelemetryEnabled && isBmi270OnlyPreset(preset)) {
    return "BMI270 telemetry is disabled in sensor configuration.";
  }
  if (!ctx.dps368TelemetryEnabled && (preset === "pressure" || preset === "dps368Temperature")) {
    return "DPS368 telemetry is disabled in sensor configuration.";
  }
  if (
    !ctx.sht40TelemetryEnabled &&
    (preset === "sht40Humidity" || preset === "sht40Temperature")
  ) {
    return "SHT40 telemetry is disabled in sensor configuration.";
  }
  if (
    !ctx.bmm350TelemetryEnabled &&
    (preset === "bmm350" || preset === "bmm350Temperature")
  ) {
    return "BMM350 telemetry is disabled in sensor configuration.";
  }
  if (
    ctx.bmi270TelemetryEnabled &&
    ctx.bmi270StreamMode === "raw" &&
    (preset === "quat" || preset === "euler")
  ) {
    return "Switch BMI270 stream mode to Fusion to view quaternion and Euler cards.";
  }
  if (
    ctx.bmi270TelemetryEnabled &&
    ctx.bmi270StreamMode === "fusion" &&
    isBmi270RawSectionPreset(preset)
  ) {
    return "Switch BMI270 stream mode to Raw to view gyro, accelerometer, and temperature cards.";
  }
  return null;
}
