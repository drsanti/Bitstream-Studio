import { STUDIO_SENSOR_SOURCE_KEY_OPTIONS } from "../../../sensor-studio/core/live/resolve-sensor-source-key.js";

/** Column 2: no live sensor — twin signal stays on simulator. */
export const TWIN_MAPPING_SENSOR_NONE = "__simulated__";

export type TwinMappingSensorId =
  | typeof TWIN_MAPPING_SENSOR_NONE
  | "bmi270"
  | "bmm350"
  | "sht40"
  | "dps368";

export type TwinMappingSubParamOption = {
  /** Path after sensor prefix (e.g. `accel.x`, `temperature`). */
  subParam: string;
  label: string;
  liveSourceKey: string;
};

export type TwinMappingSensorOption = {
  value: TwinMappingSensorId;
  label: string;
};

export const TWIN_MAPPING_SENSOR_OPTIONS: TwinMappingSensorOption[] = [
  { value: TWIN_MAPPING_SENSOR_NONE, label: "Simulated" },
  { value: "bmi270", label: "BMI270" },
  { value: "bmm350", label: "BMM350" },
  { value: "sht40", label: "SHT40" },
  { value: "dps368", label: "DPS368" },
];

const BMI270_MAGNITUDE: TwinMappingSubParamOption = {
  subParam: "accel.magnitude",
  label: "Accel magnitude",
  liveSourceKey: "bmi270.accel.magnitude",
};

function labelForSubParam(sensor: string, subParam: string): string {
  const fromAllowlist = STUDIO_SENSOR_SOURCE_KEY_OPTIONS.find(
    (o) => o.value === `${sensor}.${subParam}`,
  );
  if (fromAllowlist != null) {
    const stripped = fromAllowlist.label.replace(/^(BMI270|BMM350|SHT40|DPS368)\s+/i, "");
    return stripped.length > 0 ? stripped : subParam;
  }
  if (subParam === "accel.magnitude") {
    return BMI270_MAGNITUDE.label;
  }
  return subParam;
}

function buildSubParamsBySensor(): Record<
  Exclude<TwinMappingSensorId, typeof TWIN_MAPPING_SENSOR_NONE>,
  TwinMappingSubParamOption[]
> {
  const buckets: Record<string, TwinMappingSubParamOption[]> = {
    bmi270: [],
    bmm350: [],
    sht40: [],
    dps368: [],
  };

  for (const option of STUDIO_SENSOR_SOURCE_KEY_OPTIONS) {
    const parts = option.value.split(".");
    if (parts.length < 2) {
      continue;
    }
    const sensor = parts[0];
    const subParam = parts.slice(1).join(".");
    if (sensor !== "bmi270" && sensor !== "bmm350" && sensor !== "sht40" && sensor !== "dps368") {
      continue;
    }
    buckets[sensor].push({
      subParam,
      label: labelForSubParam(sensor, subParam),
      liveSourceKey: option.value,
    });
  }

  buckets.bmi270.push(BMI270_MAGNITUDE);

  for (const key of Object.keys(buckets)) {
    buckets[key].sort((a, b) => a.label.localeCompare(b.label));
  }

  return buckets as Record<
    Exclude<TwinMappingSensorId, typeof TWIN_MAPPING_SENSOR_NONE>,
    TwinMappingSubParamOption[]
  >;
}

export const TWIN_MAPPING_SUB_PARAMS_BY_SENSOR = buildSubParamsBySensor();

export function twinMappingSignalKey(componentId: string, signalKey: string): string {
  return `${componentId}::${signalKey}`;
}

export function parseTwinMappingSignalKey(key: string): { componentId: string; signalKey: string } | null {
  const idx = key.indexOf("::");
  if (idx <= 0) {
    return null;
  }
  return {
    componentId: key.slice(0, idx),
    signalKey: key.slice(idx + 2),
  };
}

export function decomposeTwinLiveSourceKey(
  liveSourceKey: string | undefined,
): { sensor: TwinMappingSensorId; subParam: string } {
  const trimmed = liveSourceKey?.trim() ?? "";
  if (trimmed.length === 0) {
    return { sensor: TWIN_MAPPING_SENSOR_NONE, subParam: "" };
  }
  if (trimmed === BMI270_MAGNITUDE.liveSourceKey) {
    return { sensor: "bmi270", subParam: BMI270_MAGNITUDE.subParam };
  }
  const parts = trimmed.split(".").filter((p) => p.length > 0);
  if (parts.length < 2) {
    return { sensor: TWIN_MAPPING_SENSOR_NONE, subParam: "" };
  }
  const sensor = parts[0];
  if (sensor === "bmi270" || sensor === "bmm350" || sensor === "sht40" || sensor === "dps368") {
    return { sensor, subParam: parts.slice(1).join(".") };
  }
  return { sensor: TWIN_MAPPING_SENSOR_NONE, subParam: "" };
}

export function composeTwinLiveSourceKey(sensor: TwinMappingSensorId, subParam: string): string | undefined {
  if (sensor === TWIN_MAPPING_SENSOR_NONE || subParam.length === 0) {
    return undefined;
  }
  if (sensor === "bmi270" && subParam === BMI270_MAGNITUDE.subParam) {
    return BMI270_MAGNITUDE.liveSourceKey;
  }
  return `${sensor}.${subParam}`;
}

export function resolveEffectiveTwinLiveSourceKey(args: {
  metadataLiveSourceKey?: string;
  /** `undefined` = no operator override (use metadata). `null` = force simulated. */
  overrideLiveSourceKey?: string | null;
}): string | undefined {
  if (args.overrideLiveSourceKey === null) {
    return undefined;
  }
  if (typeof args.overrideLiveSourceKey === "string") {
    const trimmed = args.overrideLiveSourceKey.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  const meta = args.metadataLiveSourceKey?.trim();
  return meta != null && meta.length > 0 ? meta : undefined;
}

export function subParamOptionsForSensor(sensor: TwinMappingSensorId): TwinMappingSubParamOption[] {
  if (sensor === TWIN_MAPPING_SENSOR_NONE) {
    return [];
  }
  return TWIN_MAPPING_SUB_PARAMS_BY_SENSOR[sensor] ?? [];
}

export function defaultSubParamForSensor(sensor: TwinMappingSensorId): string {
  const options = subParamOptionsForSensor(sensor);
  return options[0]?.subParam ?? "";
}
