import assert from "node:assert/strict";
import test from "node:test";
import {
  orderSerialPortsForDisplay,
  pickPreferredSerialPortPath,
} from "../../src/webview/bitstream-app/utils/pickPreferredSerialPortPath";

test("pick preferred — explicit serialPath when whitelisted", () => {
  assert.equal(
    pickPreferredSerialPortPath({
      availablePaths: ["COM3", "COM7"],
      preferredPath: "COM7",
      whitelistedPaths: ["COM3", "COM7"],
      displayOrder: ["COM3", "COM7"],
    }),
    "COM7",
  );
});

test("pick preferred — ignores preferred when not whitelisted", () => {
  assert.equal(
    pickPreferredSerialPortPath({
      availablePaths: ["COM3", "COM6", "COM7"],
      preferredPath: "COM6",
      whitelistedPaths: ["COM3"],
      displayOrder: ["COM3", "COM6", "COM7"],
    }),
    "COM3",
  );
});

test("pick preferred — whitelist + display order", () => {
  assert.equal(
    pickPreferredSerialPortPath({
      availablePaths: ["COM3", "COM7", "COM9"],
      preferredPath: "",
      whitelistedPaths: ["COM7", "COM3"],
      displayOrder: ["COM3", "COM7", "COM9"],
    }),
    "COM3",
  );
});

test("pick preferred — empty whitelist returns null without preferred", () => {
  assert.equal(
    pickPreferredSerialPortPath({
      availablePaths: ["COM9", "COM3"],
      whitelistedPaths: [],
      displayOrder: ["COM3", "COM9"],
    }),
    null,
  );
});

test("pick preferred — empty whitelist allows explicit active target", () => {
  assert.equal(
    pickPreferredSerialPortPath({
      availablePaths: ["COM9", "COM3"],
      preferredPath: "COM3",
      whitelistedPaths: [],
      displayOrder: ["COM9", "COM3"],
    }),
    "COM3",
  );
});

test("pick preferred — blacklisted port not chosen when only COM3 whitelisted", () => {
  assert.equal(
    pickPreferredSerialPortPath({
      availablePaths: ["COM6", "COM3"],
      preferredPath: "",
      whitelistedPaths: ["COM3"],
      displayOrder: ["COM6", "COM3"],
    }),
    "COM3",
  );
});

test("order ports for display — known order then alphabetical rest", () => {
  const ports = [
    { path: "COM9" },
    { path: "COM3" },
    { path: "COM7" },
  ];
  const ordered = orderSerialPortsForDisplay(ports, ["COM7", "COM3"]);
  assert.deepEqual(ordered.map((p) => p.path), ["COM7", "COM3", "COM9"]);
});
