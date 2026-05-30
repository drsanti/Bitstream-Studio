import assert from "node:assert/strict";
import test from "node:test";
import {
  exceedsDeltaThreshold,
  minPublishIntervalElapsed,
  shouldPublishSample,
} from "../../src/bitstream2/device/publish-gate";

test("exceedsDeltaThreshold", () => {
  assert.equal(exceedsDeltaThreshold([100], null, 50), true);
  assert.equal(exceedsDeltaThreshold([100], [100], 50), false);
  assert.equal(exceedsDeltaThreshold([160], [100], 50), true);
  assert.equal(exceedsDeltaThreshold([100], [100], 100), false);
  assert.equal(exceedsDeltaThreshold([101], [100], 100), true);
  assert.equal(exceedsDeltaThreshold([101], [100], 200), false);
});

test("minPublishIntervalElapsed", () => {
  assert.equal(minPublishIntervalElapsed(0, 100, 50), true);
  assert.equal(minPublishIntervalElapsed(100, 140, 50), false);
  assert.equal(minPublishIntervalElapsed(100, 151, 50), true);
});

test("shouldPublishSample modes", () => {
  const base = {
    current: [100],
    lastPublished: [100] as number[] | null,
    lastEmitMs: 0,
    nowMs: 1000,
    minPublishIntervalMs: 0,
    deltaX100: 100,
  };

  assert.equal(
    shouldPublishSample({ ...base, publishMode: 0 }),
    true,
  );
  assert.equal(
    shouldPublishSample({ ...base, publishMode: 1 }),
    false,
  );
  assert.equal(
    shouldPublishSample({ ...base, publishMode: 1, current: [250] }),
    true,
  );
  assert.equal(
    shouldPublishSample({ ...base, publishMode: 2, current: [100] }),
    true,
  );

  assert.equal(
    shouldPublishSample({
      ...base,
      publishMode: 1,
      current: [250],
      lastEmitMs: 1000,
      nowMs: 1020,
      minPublishIntervalMs: 50,
    }),
    false,
  );
});
