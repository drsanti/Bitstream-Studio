import assert from "node:assert/strict";
import test from "node:test";
import {
  classifySerialPortConnection,
  isLikelyBluetoothSerialPort,
  isLikelyUsbSerialPort,
} from "../../src/serialport-bridge/classifySerialPort";

test("USB Cypress PSoC kit", () => {
  const port = {
    path: "COM3",
    manufacturer: "Cypress",
    pnpId: "USB\\VID_04B4&PID_F155&MI_02\\7&17756BBD&0&0002",
    vendorId: "04B4",
    productId: "F155",
  };
  assert.equal(isLikelyUsbSerialPort(port), true);
  assert.equal(isLikelyBluetoothSerialPort(port), false);
  assert.equal(classifySerialPortConnection(port), "usb");
});

test("Windows Bluetooth SPP (BTHENUM)", () => {
  const port = {
    path: "COM9",
    manufacturer: "Microsoft",
    pnpId: "BTHENUM\\{00001101-0000-1000-8000-00805F9B34FB}_LOCALMFG&0002\\7&ABC&0&0001",
    locationId: "00000000.00000000.00000000.00000000.00000000.00000000.00000000",
  };
  assert.equal(isLikelyBluetoothSerialPort(port), true);
  assert.equal(isLikelyUsbSerialPort(port), false);
  assert.equal(classifySerialPortConnection(port), "bluetooth");
});

test("Microsoft without BTH metadata is not classified as Bluetooth", () => {
  const port = {
    path: "COM6",
    manufacturer: "Microsoft",
  };
  assert.equal(isLikelyBluetoothSerialPort(port), false);
  assert.equal(classifySerialPortConnection(port), "unknown");
});
