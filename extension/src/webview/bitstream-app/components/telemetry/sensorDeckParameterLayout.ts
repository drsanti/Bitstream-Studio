/**
 * Right-panel sensor deck (`TRNParameter` + gauge): fixed value + unit widths so every row’s
 * value+unit block matches → `flex-1` gauge column stays the same width across the panel.
 */
export const SENSOR_DECK_VALUE_TEXT_COL_CLASS = "w-[8ch]";
/** Fits longest units in deck (`rad/s`, `m/s²`); empty unit rows keep the same reserve. */
export const SENSOR_DECK_UNIT_COL_CLASS = "w-[6ch]";
