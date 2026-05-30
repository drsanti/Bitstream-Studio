import assert from "node:assert/strict";
import test from "node:test";
import {
  CY_WCM_SECURITY_UNKNOWN,
  CY_WCM_SECURITY_WPA2_AES_PSK,
  resolveWcmSecurityUint32,
  WCM_SECURITY_PRESET_DEFAULT_KEY,
} from "../../src/bitstream/wifi/wifi-wcm-security";

test("WPA2-Personal (AES) matches WCM bitmask (0x00400004)", () => {
  assert.equal(CY_WCM_SECURITY_WPA2_AES_PSK, 0x00400004);
});

test("resolveWcmSecurityUint32 uses preset and custom hex", () => {
  assert.equal(resolveWcmSecurityUint32(WCM_SECURITY_PRESET_DEFAULT_KEY, ""), CY_WCM_SECURITY_WPA2_AES_PSK);
  assert.equal(resolveWcmSecurityUint32("custom", "0x00400004"), 0x00400004);
  assert.equal(resolveWcmSecurityUint32("custom", "4194308"), 4194308);
});
