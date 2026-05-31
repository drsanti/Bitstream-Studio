import type {
  Bmi270LiveSample,
  Bmi270ResolvedSampleWithFrameFlags,
  Bmi270SampleCacheState,
} from "../types/bitstreamWorkspaceTypes";
import { BMI270_FIELD_TTL_MS, BMI270_NUMERIC_KEYS } from "./bmi270TelemetryConstants";

function applyIncomingBmi270Fields(
  target: Bmi270ResolvedSampleWithFrameFlags,
  incoming: Bmi270LiveSample,
  updatedAtByKey: Bmi270SampleCacheState["updatedAtByKey"],
  nowMs: number,
): void {
  BMI270_NUMERIC_KEYS.forEach((key) => {
    if (key in incoming && typeof incoming[key] === "number") {
      (target as unknown as Record<string, number>)[key] = incoming[key] as number;
      updatedAtByKey[key] = nowMs;
    }
  });
}

/** Session aggregate wins over per-field TTL drops in the deck cache. */
export function finalizeBmi270DeckSample(
  cachedSample: Bmi270ResolvedSampleWithFrameFlags | null | undefined,
  sessionSample: Bmi270LiveSample | null | undefined,
): Bmi270ResolvedSampleWithFrameFlags | null {
  if (sessionSample == null && cachedSample == null) {
    return null;
  }
  if (cachedSample == null) {
    return sessionSample as Bmi270ResolvedSampleWithFrameFlags;
  }
  if (sessionSample == null) {
    return cachedSample;
  }

  const out: Bmi270ResolvedSampleWithFrameFlags = {
    ...cachedSample,
    counter: sessionSample.counter,
    sourceHint: sessionSample.sourceHint,
    isBmi270FusionPayloadNow: sessionSample.isBmi270FusionPayload === true,
    isBmi270FusionPayload:
      sessionSample.isBmi270FusionPayload === true || cachedSample.isBmi270FusionPayload,
  };

  for (const key of BMI270_NUMERIC_KEYS) {
    if (key in sessionSample && typeof sessionSample[key] === "number") {
      (out as unknown as Record<string, number>)[key] = sessionSample[key] as number;
    }
  }

  return out;
}

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
    const sample = {
      ...(incoming as unknown as Record<string, unknown>),
      isBmi270FusionPayloadNow: incoming.isBmi270FusionPayload === true,
    } as Bmi270ResolvedSampleWithFrameFlags;
    applyIncomingBmi270Fields(sample, incoming, updatedAtByKey, nowMs);
    return {
      sample,
      updatedAtByKey,
      lastIncomingCounter: incoming.counter,
    };
  }
  if (!cached) {
    return null;
  }

  const counterAdvanced =
    incoming != null && incoming.counter !== cached.lastIncomingCounter;

  const mergedSample: Bmi270ResolvedSampleWithFrameFlags = incoming
    ? {
        ...cached.sample,
        counter: incoming.counter,
        sourceHint: incoming.sourceHint,
        isBmi270FusionPayloadNow: incoming.isBmi270FusionPayload === true,
        isBmi270FusionPayload:
          incoming.isBmi270FusionPayload === true || cached.sample.isBmi270FusionPayload,
      }
    : { ...cached.sample, isBmi270FusionPayloadNow: cached.sample.isBmi270FusionPayloadNow };
  const updatedAtByKey: Bmi270SampleCacheState["updatedAtByKey"] = {
    ...cached.updatedAtByKey,
  };

  if (incoming) {
    applyIncomingBmi270Fields(mergedSample, incoming, updatedAtByKey, nowMs);
  }

  if (counterAdvanced || incoming == null) {
    BMI270_NUMERIC_KEYS.forEach((key) => {
      const fieldUpdatedAt = updatedAtByKey[key];
      const staleTtlMs = BMI270_FIELD_TTL_MS[key];
      const fieldIsStale =
        typeof fieldUpdatedAt === "number" && nowMs - fieldUpdatedAt > staleTtlMs;
      if (fieldIsStale) {
        delete updatedAtByKey[key];
        delete (mergedSample as unknown as Record<string, unknown>)[key];
      }
    });
  }

  if (incoming) {
    applyIncomingBmi270Fields(mergedSample, incoming, updatedAtByKey, nowMs);
  }

  return {
    sample: mergedSample,
    updatedAtByKey,
    lastIncomingCounter: incoming?.counter ?? cached.lastIncomingCounter,
  };
}
