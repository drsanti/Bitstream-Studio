import assert from "node:assert/strict";
import test from "node:test";
import {
  orderSerialPortsForDisplay,
  pickPreferredSerialPortPath,
} from "../../src/webview/bitstream-app/utils/pickPreferredSerialPortPath";

test("pick preferred — explicit serialPath when available", () => {
  assert.equal(
    pickPreferredSerialPortPath({
      availablePaths: ["COM3", "COM7"],
      preferredPath: "COM7",
      whitelistedPaths: ["COM3"],
      displayOrder: ["COM3", "COM7"],
    }),
    "COM7",
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

test("pick preferred — empty whitelist uses display order", () => {
  assert.equal(
    pickPreferredSerialPortPath({
      availablePaths: ["COM9", "COM3"],
      whitelistedPaths: [],
      displayOrder: ["COM3", "COM9"],
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
