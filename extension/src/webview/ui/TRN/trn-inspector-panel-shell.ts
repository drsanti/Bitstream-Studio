/** Shared inspector panel chrome — tabs first, context bar below, scroll body. */

export const TRN_INSPECTOR_PANEL_SHELL_CLASS =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-700/55 bg-zinc-950/45";

/** Inside workbench INSPECTOR or dual-pane slots — no nested card border. */
export const TRN_INSPECTOR_PANEL_EMBEDDED_SHELL_CLASS =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";

export function resolveInspectorPanelShellClass(embedded = false): string {
  return embedded
    ? TRN_INSPECTOR_PANEL_EMBEDDED_SHELL_CLASS
    : TRN_INSPECTOR_PANEL_SHELL_CLASS;
}

export const TRN_INSPECTOR_PANEL_BODY_COLUMN_CLASS =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";

export const TRN_INSPECTOR_PANEL_SCROLL_CLASS =
  "scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-2";

export const TRN_INSPECTOR_CONTEXT_BAR_WRAP_CLASS =
  "shrink-0 border-b border-zinc-800/70 px-2.5 py-2";
