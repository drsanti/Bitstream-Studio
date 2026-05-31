import type { ReadingAxis } from "./ReadingAxisNumber";
import { readingParamAxisValueClass } from "./param-axis-classes";

/** Label column + four component columns (BMI270 w/x/y/z). */
export const INSPECTOR_READINGS_GRID_5 =
  "minmax(6.25rem, 1.15fr) repeat(4, minmax(2.65rem, 1fr))";

/** Label column + three component columns (vec3). */
export const INSPECTOR_READINGS_GRID_4 =
  "minmax(6.25rem, 1.15fr) repeat(3, minmax(2.65rem, 1fr))";

export const INSPECTOR_READINGS_ROW_CLASS =
  "grid w-full items-baseline gap-x-3 border-t border-zinc-800/50 py-1.5 text-[10px] first:border-t-0";

export const INSPECTOR_READINGS_VALUE_CELL = "block w-full text-right tabular-nums";

export const INSPECTOR_READINGS_EMPTY_CELL = "block w-full min-h-[1em]";
