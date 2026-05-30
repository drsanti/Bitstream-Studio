import { BMI270_FIELD_TTL_MS, BMI270_NUMERIC_KEYS } from "./bmi270TelemetryConstants";
import type {
  Bmi270LiveSample,
  Bmi270SampleCacheState,
  Bmi270ResolvedSampleWithFrameFlags,
} from "../types/bitstreamWorkspaceTypes";

export function mergeBmi270SampleCache(
  cached: Bmi270SampleCacheState | null,
  incoming: Bmi270LiveSample | undefined,
  nowMs: number,
): Bmi270SampleCacheState | null {
  if (!incoming && !cached) {
    return null;
  }
  if (!cached && incoming) {
    const updatedAtByKey: Bmi270SampleCacheState["updatedAtByKey"] = {};
    BMI270_NUMERIC_KEYS.forEach((key) => {
      if (typeof incoming[key] === "number") {
        updatedAtByKey[key] = nowMs;
      }
    });
    return {
      sample: {
        ...(incoming as unknown as Record<string, unknown>),
        isBmi270FusionPayloadNow: incoming.isBmi270FusionPayload === true,
      } as Bmi270ResolvedSampleWithFrameFlags,
      updatedAtByKey,
    };
  }
  if (!cached) {
    return null;
  }

  const mergedSample: Bmi270ResolvedSampleWithFrameFlags = incoming
    ? {
        ...cached.sample,
        ...incoming,
        sourceHint: incoming.sourceHint,
        counter: incoming.counter,
        isBmi270FusionPayloadNow: incoming.isBmi270FusionPayload === true,
        isBmi270FusionPayload:
          incoming.isBmi270FusionPayload || cached.sample.isBmi270FusionPayload,
      }
    : { ...cached.sample, isBmi270FusionPayloadNow: cached.sample.isBmi270FusionPayloadNow };
  const updatedAtByKey: Bmi270SampleCacheState["updatedAtByKey"] = {
    ...cached.updatedAtByKey,
  };

  BMI270_NUMERIC_KEYS.forEach((key) => {
    if (incoming && typeof incoming[key] === "number") {
      updatedAtByKey[key] = nowMs;
    }

    const fieldUpdatedAt = updatedAtByKey[key];
    const staleTtlMs = BMI270_FIELD_TTL_MS[key];
    const fieldIsStale =
      typeof fieldUpdatedAt === "number" && nowMs - fieldUpdatedAt > staleTtlMs;
    if (fieldIsStale) {
      delete updatedAtByKey[key];
      delete (mergedSample as unknown as Record<string, unknown>)[key];
    }
  });

  return {
    sample: mergedSample,
    updatedAtByKey,
  };
}
