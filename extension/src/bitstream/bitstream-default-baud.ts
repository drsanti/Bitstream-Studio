/** Default debug UART baud — must match firmware `CYBSP_DEBUG_UART` and host/MCP open requests. */
export const BITSTREAM_DEFAULT_BAUD_RATE = 921600;

export const BITSTREAM_DEFAULT_BAUD_RATE_TEXT = String(BITSTREAM_DEFAULT_BAUD_RATE);

const LEGACY_BAUD_TEXT = new Set(["115200", "460800"]);

/** Migrate persisted UI values from previous project defaults. */
export function normalizeBitstreamBaudRateText(raw: string | undefined): string {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (LEGACY_BAUD_TEXT.has(t)) {
    return BITSTREAM_DEFAULT_BAUD_RATE_TEXT;
  }
  return t.length > 0 ? t : BITSTREAM_DEFAULT_BAUD_RATE_TEXT;
}

/** Numeric baud for serial open (migrates legacy 115200 / 460800). */
export function normalizeBitstreamBaudRate(raw: number | string | undefined): number {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    if (raw === 115200 || raw === 460800) {
      return BITSTREAM_DEFAULT_BAUD_RATE;
    }
    return Math.floor(raw);
  }
  const text = normalizeBitstreamBaudRateText(typeof raw === "string" ? raw : undefined);
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : BITSTREAM_DEFAULT_BAUD_RATE;
}
