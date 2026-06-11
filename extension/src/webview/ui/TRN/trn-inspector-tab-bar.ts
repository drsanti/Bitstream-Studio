/**
 * Horizontal tab bar shared by inspector panels (Sensor Studio, Course Studio, Telemetry).
 * Pair with {@link TRNInspectorContextBar} below tabs — see `trn-inspector-panel-shell.ts`.
 */

export const TRN_INSPECTOR_TAB_BAR_WRAP_CLASS =
  "nodrag nopan nowheel min-w-0 w-full shrink-0 pt-0 pb-0";

export const TRN_INSPECTOR_TAB_LIST_CLASS =
  "inline-flex min-w-0 w-full gap-0.5 border-0 bg-transparent p-0";

export const TRN_INSPECTOR_TAB_TRIGGER_CLASS =
  "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-t-md rounded-b-none border-b-0 px-2 py-1 text-[11px] font-medium tracking-wide";

/** Single-line tab label; pair with {@link TRN_INSPECTOR_TAB_TRIGGER_CLASS}. */
export const TRN_INSPECTOR_TAB_LABEL_CLASS = "min-w-0 truncate";

/** Selected inspector tab — emerald (Node + Canvas inspector). */
export const TRN_INSPECTOR_TAB_ACTIVE_CLASS =
  "border-emerald-400/45 bg-emerald-950/35 text-emerald-100 shadow-sm";

/** Active trigger: emerald on `accentTabId`, zinc otherwise (telemetry deck accent tab only). */
export function trnInspectorTabActiveClassName(
  activeTab: string,
  accentTabId: string,
): string {
  return activeTab === accentTabId
    ? TRN_INSPECTOR_TAB_ACTIVE_CLASS
    : "border-zinc-500/45 text-zinc-100 bg-zinc-800/55 shadow-sm";
}
