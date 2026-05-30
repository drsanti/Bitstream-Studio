/**
 * Values mirror Infineon Wi‑Fi Connection Manager `cy_wcm_security_t` (`cy_wcm.h` bitmask composition).
 * They are forwarded over Bitstream / IPC as `uint32_t` to CM33/WCM — not sequential integers.
 */

const WEP_ENABLED = 0x0001;
const TKIP_ENABLED = 0x0002;
const AES_ENABLED = 0x0004;
const SHARED_ENABLED = 0x00008000;
const WPA_SECURITY = 0x00200000;
const WPA2_SECURITY = 0x00400000;
const WPA3_SECURITY = 0x01000000;

/** `CY_WCM_SECURITY_OPEN` */
export const CY_WCM_SECURITY_OPEN = 0;

/** `CY_WCM_SECURITY_WEP_PSK` */
export const CY_WCM_SECURITY_WEP_PSK = WEP_ENABLED;

/** `CY_WCM_SECURITY_WEP_SHARED` */
export const CY_WCM_SECURITY_WEP_SHARED = WEP_ENABLED | SHARED_ENABLED;

/** `CY_WCM_SECURITY_WPA_AES_PSK` */
export const CY_WCM_SECURITY_WPA_AES_PSK = WPA_SECURITY | AES_ENABLED;

/** `CY_WCM_SECURITY_WPA2_AES_PSK` — typical home AP “WPA2‑Personal”. */
export const CY_WCM_SECURITY_WPA2_AES_PSK = WPA2_SECURITY | AES_ENABLED;

/** `CY_WCM_SECURITY_WPA2_TKIP_PSK` */
export const CY_WCM_SECURITY_WPA2_TKIP_PSK = WPA2_SECURITY | TKIP_ENABLED;

/** `CY_WCM_SECURITY_WPA2_MIXED_PSK` */
export const CY_WCM_SECURITY_WPA2_MIXED_PSK = WPA2_SECURITY | AES_ENABLED | TKIP_ENABLED;

/** `CY_WCM_SECURITY_WPA2_WPA_AES_PSK` */
export const CY_WCM_SECURITY_WPA2_WPA_AES_PSK = WPA2_SECURITY | WPA_SECURITY | AES_ENABLED;

/** `CY_WCM_SECURITY_WPA3_SAE` */
export const CY_WCM_SECURITY_WPA3_SAE = WPA3_SECURITY | AES_ENABLED;

/** `CY_WCM_SECURITY_WPA3_WPA2_PSK` */
export const CY_WCM_SECURITY_WPA3_WPA2_PSK = WPA3_SECURITY | WPA2_SECURITY | AES_ENABLED;

/** `CY_WCM_SECURITY_UNKNOWN` (WCM may auto-detect AP security during join flow). */
export const CY_WCM_SECURITY_UNKNOWN = 0xffffffff;

export const WCM_SECURITY_PRESET_DEFAULT_KEY = "wpa2_aes";

export interface WcmSecurityPreset {
  readonly key: string;
  /** User-visible label (IEEE / common marketing names). */
  readonly label: string;
  readonly value: number;
}

/** Curated presets for the Bitstream Wi‑Fi panel (matches CM33 `cy_wcm_security_t`). */
export const WCM_SECURITY_PRESETS: readonly WcmSecurityPreset[] = [
  {
    key: "auto",
    label: "Auto-detect (CY_WCM_SECURITY_UNKNOWN)",
    value: CY_WCM_SECURITY_UNKNOWN,
  },
  { key: "open", label: "Open (no encryption)", value: CY_WCM_SECURITY_OPEN },
  {
    key: "wpa2_aes",
    label: "WPA2-Personal (AES-CCMP)",
    value: CY_WCM_SECURITY_WPA2_AES_PSK,
  },
  {
    key: "wpa_wpa2_aes",
    label: "WPA / WPA2-Personal (AES)",
    value: CY_WCM_SECURITY_WPA2_WPA_AES_PSK,
  },
  {
    key: "wpa2_mixed",
    label: "WPA2-Personal (AES + TKIP)",
    value: CY_WCM_SECURITY_WPA2_MIXED_PSK,
  },
  {
    key: "wpa2_tkip",
    label: "WPA2-Personal (TKIP)",
    value: CY_WCM_SECURITY_WPA2_TKIP_PSK,
  },
  {
    key: "wpa_aes",
    label: "WPA-Personal (AES)",
    value: CY_WCM_SECURITY_WPA_AES_PSK,
  },
  { key: "wpa3_sae", label: "WPA3-Personal (SAE)", value: CY_WCM_SECURITY_WPA3_SAE },
  {
    key: "wpa3_wpa2",
    label: "WPA3 / WPA2-Personal (transition)",
    value: CY_WCM_SECURITY_WPA3_WPA2_PSK,
  },
  { key: "wep_open", label: "WEP (open authentication)", value: CY_WCM_SECURITY_WEP_PSK },
  { key: "wep_shared", label: "WEP (shared key)", value: CY_WCM_SECURITY_WEP_SHARED },
  { key: "custom", label: "Custom (raw uint32)…", value: CY_WCM_SECURITY_WPA2_AES_PSK },
];

const PRESET_BY_KEY = new Map(WCM_SECURITY_PRESETS.map((p) => [p.key, p] as const));

export function formatWcmSecurityHex(value: number): string {
  const u = value >>> 0;
  return `0x${u.toString(16).toUpperCase().padStart(8, "0")}`;
}

/**
 * Resolve the `uint32` sent in the connect request. Use {@link WCM_SECURITY_PRESET_DEFAULT_KEY} when input is invalid.
 */
export function resolveWcmSecurityUint32(presetKey: string, customText: string): number {
  const fallback = CY_WCM_SECURITY_WPA2_AES_PSK;
  if (presetKey === "custom") {
    const raw = customText.trim();
    if (raw === "") {
      return fallback;
    }
    if (/^0x/i.test(raw)) {
      const v = Number.parseInt(raw.replace(/^0x/i, ""), 16);
      return Number.isFinite(v) ? (v >>> 0) : fallback;
    }
    const v = Number.parseInt(raw, 10);
    return Number.isFinite(v) ? (v >>> 0) : fallback;
  }
  const preset = PRESET_BY_KEY.get(presetKey);
  return preset ? preset.value : fallback;
}
