import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPortInfoAsJson,
  portInfoReadableRows,
} from "../../src/webview/serialport/formatPortInfoReadable";

test("portInfoReadableRows omits empty optional fields", () => {
  const rows = portInfoReadableRows({
    path: "COM3",
    manufacturer: "Cypress",
    vendorId: "04B4",
    productId: "F155",
    pnpId: "USB\\VID_04B4&PID_F155",
  });
  assert.deepEqual(
    rows.map((row) => row.label),
    ["Port", "Connection", "Manufacturer", "Vendor ID", "Product ID", "PnP ID"],
  );
  assert.equal(rows[0]?.value, "COM3");
  assert.equal(rows[0]?.monospace, true);
});

test("formatPortInfoAsJson pretty-prints port info", () => {
  const json = formatPortInfoAsJson({ path: "COM7" });
  assert.equal(json, '{\n  "path": "COM7"\n}');
});
