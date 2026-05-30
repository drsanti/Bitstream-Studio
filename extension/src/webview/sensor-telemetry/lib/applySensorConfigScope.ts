/*******************************************************************************
 * File Name : applySensorConfigScope.ts
 *
 * Description : Global vs card-scoped sensor config apply for Configuration pane.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import {
  applyBmi270FirmwareExtrasIfDirty,
  applyBmi270FusionFeedIfDirty,
  applyBmi270StreamModeIfDirty,
  type Bmi270FirmwareExtrasTransport,
} from "../../bitstream-app/bridge/bmi270FirmwareExtrasSync.js";
import {
  SENSOR_SOURCE_ID_BMI270,
  getSensorSourceDisplayLabel,
} from "../../bitstream-app/constants/sensorSourceIds.js";
import { useBitstreamConfigStore } from "../../bitstream-app/state/bitstreamConfig.store.js";
import {
  isBmi270FusionFeedCardDirty,
  isBmi270OperationCardDirty,
  isBmi270SamplingCardDirty,
  isBmi270DeltaCardDirty,
  isBmi270MinPublishCardDirty,
  isSensorCfgFieldsDirty,
  type SensorCfgRowField,
} from "./configPaneCardDirty.js";

export type SensorCfgApplyScope =
  | { kind: "global" }
  | { kind: "bmi270-operation" }
  | { kind: "bmi270-fusion-feed" }
  | { kind: "bmi270-sampling" }
  | { kind: "bmi270-delta" }
  | { kind: "bmi270-min-publish" }
  | { kind: "sensor-operation"; sourceId: number }
  | { kind: "sensor-sampling"; sourceId: number }
  | { kind: "sensor-delta"; sourceId: number }
  | { kind: "sensor-min-publish"; sourceId: number };

export function sensorCfgApplyScopeLabel(scope: SensorCfgApplyScope): string
{
  switch (scope.kind)
  {
    case "global":
      return "Apply all pending sensor config changes";
    case "bmi270-operation":
      return "Apply BMI270 operation and stream mode";
    case "bmi270-fusion-feed":
      return "Apply BMI270 fusion feed rate";
    case "bmi270-sampling":
      return "Apply BMI270 sample rate";
    case "bmi270-delta":
      return "Apply BMI270 delta threshold";
    case "bmi270-min-publish":
      return "Apply BMI270 minimum publish interval";
    case "sensor-operation":
      return `Apply ${getSensorSourceDisplayLabel(scope.sourceId)} operation settings`;
    case "sensor-sampling":
      return `Apply ${getSensorSourceDisplayLabel(scope.sourceId)} sample rate`;
    case "sensor-delta":
      return `Apply ${getSensorSourceDisplayLabel(scope.sourceId)} delta threshold`;
    case "sensor-min-publish":
      return `Apply ${getSensorSourceDisplayLabel(scope.sourceId)} minimum publish interval`;
  }
}

function fieldsForScope(scope: SensorCfgApplyScope): {
  sourceId: number | null;
  fields: readonly SensorCfgRowField[];
} | null
{
  switch (scope.kind)
  {
    case "bmi270-operation":
      return {
        sourceId: SENSOR_SOURCE_ID_BMI270,
        fields: ["enabled", "publishMode", "mask"],
      };
    case "bmi270-sampling":
      return { sourceId: SENSOR_SOURCE_ID_BMI270, fields: ["samplingIntervalMs"] };
    case "bmi270-delta":
      return { sourceId: SENSOR_SOURCE_ID_BMI270, fields: ["deltaX100"] };
    case "bmi270-min-publish":
      return { sourceId: SENSOR_SOURCE_ID_BMI270, fields: ["minPublishIntervalMs"] };
    case "sensor-operation":
      return { sourceId: scope.sourceId, fields: ["enabled", "publishMode"] };
    case "sensor-sampling":
      return { sourceId: scope.sourceId, fields: ["samplingIntervalMs"] };
    case "sensor-delta":
      return { sourceId: scope.sourceId, fields: ["deltaX100"] };
    case "sensor-min-publish":
      return { sourceId: scope.sourceId, fields: ["minPublishIntervalMs"] };
    default:
      return null;
  }
}

function scopeHasWork(scope: SensorCfgApplyScope): boolean
{
  if (scope.kind === "global")
  {
    return true;
  }
  if (scope.kind === "bmi270-operation")
  {
    return isBmi270OperationCardDirty();
  }
  if (scope.kind === "bmi270-fusion-feed")
  {
    return isBmi270FusionFeedCardDirty();
  }
  if (scope.kind === "bmi270-sampling")
  {
    return isBmi270SamplingCardDirty();
  }
  if (scope.kind === "bmi270-delta")
  {
    return isBmi270DeltaCardDirty();
  }
  if (scope.kind === "bmi270-min-publish")
  {
    return isBmi270MinPublishCardDirty();
  }
  const mapped = fieldsForScope(scope);
  if (mapped?.sourceId == null)
  {
    return false;
  }
  return isSensorCfgFieldsDirty(mapped.sourceId, mapped.fields);
}

export async function runSensorCfgApplyScope(args: {
  scope: SensorCfgApplyScope;
  applyDirtySensorConfigs: () => Promise<boolean>;
  applyDirtySensorConfigForSource: (sourceId: number) => Promise<boolean>;
  bmi270Transport: Bmi270FirmwareExtrasTransport;
  publishBmi270StreamModeUpdated: (payload: {
    bmi270StreamMode: ReturnType<typeof useBitstreamConfigStore.getState>["bmi270StreamMode"];
    firmwareApplied?: boolean;
    timestampMs: number;
  }) => void;
  publishBmi270FusionFeedUpdated: (payload: {
    appliedIntervalMs: number;
    timestampMs: number;
  }) => void;
}): Promise<{ ok: boolean; error?: string }>
{
  const {
    scope,
    applyDirtySensorConfigs,
    applyDirtySensorConfigForSource,
    bmi270Transport,
    publishBmi270StreamModeUpdated,
    publishBmi270FusionFeedUpdated,
  } = args;

  if (!scopeHasWork(scope))
  {
    return { ok: true };
  }

  if (scope.kind === "global")
  {
    const cfgOk = await applyDirtySensorConfigs();
    if (!cfgOk)
    {
      return { ok: false, error: "Sensor config apply failed" };
    }
    const extras = await applyBmi270FirmwareExtrasIfDirty(bmi270Transport);
    if (!extras.ok)
    {
      return { ok: false, error: extras.error ?? "BMI270 extras apply failed" };
    }
    const cfg = useBitstreamConfigStore.getState();
    publishBmi270StreamModeUpdated({
      bmi270StreamMode: cfg.bmi270StreamMode,
      firmwareApplied: true,
      timestampMs: Date.now(),
    });
    publishBmi270FusionFeedUpdated({
      appliedIntervalMs: cfg.bmi270FusionFeedIntervalMs,
      timestampMs: Date.now(),
    });
    return { ok: true };
  }

  if (scope.kind === "bmi270-fusion-feed")
  {
    const extras = await applyBmi270FusionFeedIfDirty(bmi270Transport);
    if (!extras.ok)
    {
      return { ok: false, error: extras.error ?? "BMI270 fusion feed apply failed" };
    }
    publishBmi270FusionFeedUpdated({
      appliedIntervalMs: useBitstreamConfigStore.getState().bmi270FusionFeedIntervalMs,
      timestampMs: Date.now(),
    });
    return { ok: true };
  }

  const mapped = fieldsForScope(scope);
  if (mapped?.sourceId != null && isSensorCfgFieldsDirty(mapped.sourceId, mapped.fields))
  {
    const cfgOk = await applyDirtySensorConfigForSource(mapped.sourceId);
    if (!cfgOk)
    {
      return { ok: false, error: "Sensor config apply failed" };
    }
  }

  if (scope.kind === "bmi270-operation")
  {
    const extras = await applyBmi270StreamModeIfDirty(bmi270Transport);
    if (!extras.ok)
    {
      return { ok: false, error: extras.error ?? "BMI270 stream mode apply failed" };
    }
    publishBmi270StreamModeUpdated({
      bmi270StreamMode: useBitstreamConfigStore.getState().bmi270StreamMode,
      firmwareApplied: true,
      timestampMs: Date.now(),
    });
  }

  return { ok: true };
}
