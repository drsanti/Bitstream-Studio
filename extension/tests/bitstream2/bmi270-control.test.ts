import assert from "node:assert/strict";
import test from "node:test";
import { BS2_CMD } from "../../src/bitstream2/domains/config/commands";
import {
  bmi270StreamModeCodeToUi,
  bmi270StreamModeUiToCode,
  decodeBmi270FusionFeedResBody,
  decodeBmi270ModeResBody,
  encodeBmi270FusionFeedSetBody,
  encodeBmi270ModeSetBody,
} from "../../src/bitstream2/domains/bmi270/bmi270-control";
import { BsFirmwareSimulator } from "../../src/bitstream2/device/firmware-simulator";
import { encodeReq, decodeRes } from "../../src/bitstream2/protocol/req-res";
import { encodeBsEnvelope } from "../../src/bitstream2/framing/bs-envelope";
import { BS_TYPE } from "../../src/bitstream2/protocol/types";
import { BsFramer } from "../../src/bitstream2/framing/bs-framer";

test("bmi270-control encode/decode round-trip", () => {
  assert.deepEqual(encodeBmi270ModeSetBody(2), Uint8Array.of(2));
  assert.equal(decodeBmi270ModeResBody(Uint8Array.of(1)), 1);
  assert.equal(bmi270StreamModeUiToCode("fusion"), 1);
  assert.equal(bmi270StreamModeCodeToUi(2), "hybrid");

  const feed = encodeBmi270FusionFeedSetBody(40);
  assert.equal(decodeBmi270FusionFeedResBody(feed), 40);
});

test("BsFirmwareSimulator BMI270 BS2 commands", () => {
  const tx: Uint8Array[] = [];
  const sim = new BsFirmwareSimulator((bytes) => tx.push(bytes));
  const framer = new BsFramer();

  const sendReq = (cmdId: number, body: Uint8Array) => {
    const wire = encodeBsEnvelope({
      type: BS_TYPE.REQ,
      payload: encodeReq({ reqId: 7, cmdId, flags: 0, body }),
    }).bytes;
    sim.rxFromHost(wire);
    const last = tx.at(-1);
    assert.ok(last);
    const frames = framer.feed(last!);
    const resFrame = frames.find((f) => f.type === BS_TYPE.RES);
    assert.ok(resFrame);
    const res = decodeRes(resFrame!.payload);
    assert.ok(res);
    return res;
  };

  const modeSet = sendReq(BS2_CMD.BMI270_MODE_SET, encodeBmi270ModeSetBody(1));
  assert.equal(modeSet.status, 0);
  assert.equal(decodeBmi270ModeResBody(modeSet.body), 1);

  const modeGet = sendReq(BS2_CMD.BMI270_MODE_GET, new Uint8Array(0));
  assert.equal(decodeBmi270ModeResBody(modeGet.body), 1);

  const feedSet = sendReq(BS2_CMD.BMI270_FUSION_FEED_SET, encodeBmi270FusionFeedSetBody(25));
  assert.equal(feedSet.status, 0);
  assert.equal(decodeBmi270FusionFeedResBody(feedSet.body), 25);

  const feedGet = sendReq(BS2_CMD.BMI270_FUSION_FEED_GET, new Uint8Array(0));
  assert.equal(decodeBmi270FusionFeedResBody(feedGet.body), 25);
});
