import assert from "node:assert/strict";
import test from "node:test";

import {
  VisionMediaPipeDetectQueue,
  VisionMediaPipeTimestampCounter,
} from "../../src/webview/sensor-studio/core/camera/studio-vision-mediapipe-detect-queue";

test("VisionMediaPipeDetectQueue assigns strictly increasing timestamps", async () => {
  const queue = new VisionMediaPipeDetectQueue();
  const fakeVideo = { currentTime: 0.5 } as HTMLVideoElement;
  const stamps: number[] = [];

  await queue.run(fakeVideo, (ts) => {
    stamps.push(ts);
    return null;
  });
  await queue.run(fakeVideo, (ts) => {
    stamps.push(ts);
    return null;
  });

  assert.equal(stamps.length, 2);
  assert.ok(stamps[1]! > stamps[0]!);
  assert.ok(stamps[0]! < 1_000_000);
});

test("VisionMediaPipeTimestampCounter stays within safe int32 ms range", () => {
  const counter = new VisionMediaPipeTimestampCounter();
  const first = counter.next();
  const second = counter.next();
  assert.equal(second, first + 1);
  assert.ok(second < 2_147_483_647);
});
