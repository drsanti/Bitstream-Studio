/** Matches shell `TRNSelect` (e.g. Bitstream / Simulator source control). */
export const BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS =
  "font-sans text-[11px] font-medium tracking-wide leading-none";

export const BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS =
  "inline-flex min-h-[21px] min-w-0 max-w-full shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1";

/** Prefix icon size for FPS / Link ready pills (matches `Radio` at 12px in decode chip). */
export const BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS = "size-3 shrink-0 opacity-90";

/**
 * Fixed-width toolbar slots (right rail) so KB/s and decode FPS chips stay visible and
 * do not shift when values change. Used with `toolbarSlot` on wire / aggregate FPS chips.
 */
export const BITSTREAM_SHELL_TOOLBAR_TELEMETRY_CHIP_TEXT_CLASS =
  "flex-1 min-w-0 truncate text-center";

export const BITSTREAM_SHELL_TOOLBAR_WIRE_RX_CHIP_CLASS =
  "inline-flex h-[21px] w-[5.25rem] min-w-[5.25rem] max-w-[5.25rem] shrink-0 items-center justify-center gap-1 rounded-full border px-2 py-1 font-sans text-[11px] font-medium tracking-wide leading-none";

export const BITSTREAM_SHELL_TOOLBAR_DECODE_FPS_CHIP_CLASS =
  "inline-flex h-[21px] w-[5rem] min-w-[5rem] max-w-[5rem] shrink-0 items-center justify-center gap-1 rounded-full border px-2 py-1 font-sans text-[11px] font-medium tracking-wide leading-none";
