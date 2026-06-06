import assert from "node:assert/strict";
import test from "node:test";

test("acquirePoseLandmarkerForVideo applies setOptions once per unique threshold pair", async () => {
  const setOptionsCalls: unknown[] = [];
  const fakeLandmarker = {
    setOptions: (opts: unknown) => {
      setOptionsCalls.push(opts);
    },
  };

  const appliedByVariant = new Map<string, string>();

  async function acquireFake(
    variant: string,
    options: { minDetectionConfidence: number; minTrackingConfidence: number },
  ) {
    const key = `${options.minDetectionConfidence}|${options.minTrackingConfidence}`;
    if (appliedByVariant.get(variant) !== key) {
      fakeLandmarker.setOptions({
        minPoseDetectionConfidence: options.minDetectionConfidence,
        minTrackingConfidence: options.minTrackingConfidence,
      });
      appliedByVariant.set(variant, key);
    }
    return fakeLandmarker;
  }

  await acquireFake("lite", { minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
  await acquireFake("lite", { minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
  await acquireFake("lite", { minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });

  assert.equal(setOptionsCalls.length, 2);
});
