/**
 * Surface chrome for {@link TRNInteractiveCard}.
 * Use `shell` instead of putting `bg-*` / `border-*` on `className`.
 */
export type TRNInteractiveCardShell =
  | "glass"
  | "solid"
  /** Like `solid` but slightly lighter (`bg-black/30`) — sensor cfg / delta cards. */
  | "solid-soft"
  | "inset"
  | "accent-cyan"
  | "accent-emerald"
  | "accent-amber"
  | "accent-rose"
  | "accent-violet";

const SHELL_BASE =
  "relative flex min-h-0 flex-col overflow-hidden rounded-md border shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm";

export const TRN_INTERACTIVE_CARD_SHELL_CLASS: Record<TRNInteractiveCardShell, string> = {
  glass: `${SHELL_BASE} border-zinc-700/85 bg-zinc-900/70`,
  solid: `${SHELL_BASE} border-zinc-700/80 bg-black/40`,
  "solid-soft": `${SHELL_BASE} border-zinc-700/80 bg-black/30`,
  inset: `${SHELL_BASE} border-zinc-800/80 bg-zinc-950/55`,
  "accent-cyan": `${SHELL_BASE} border-cyan-800/45 bg-zinc-900/65 bg-linear-to-br from-cyan-950/25 to-transparent`,
  "accent-emerald": `${SHELL_BASE} border-emerald-800/40 bg-zinc-900/65 bg-linear-to-br from-emerald-950/20 to-transparent`,
  "accent-amber": `${SHELL_BASE} border-amber-800/40 bg-zinc-900/65 bg-linear-to-br from-amber-950/20 to-transparent`,
  "accent-rose": `${SHELL_BASE} border-rose-800/40 bg-zinc-900/65 bg-linear-to-br from-rose-950/20 to-transparent`,
  "accent-violet": `${SHELL_BASE} border-violet-800/40 bg-zinc-900/65 bg-linear-to-br from-violet-950/20 to-transparent`,
};

/** Padding rhythm per shell (solid family uses uniform `p-2` on telemetry decks). */
export function trnInteractiveCardPaddingClass(
  shell: TRNInteractiveCardShell,
  collapsible: boolean,
  collapsed: boolean,
): string {
  if (shell === "solid" || shell === "solid-soft") {
    return "p-2";
  }
  if (!collapsible) {
    return "p-2";
  }
  return collapsed ? "px-2 pt-1 pb-1" : "px-2 pt-1 pb-2";
}

export function trnInteractiveCardShellClass(shell: TRNInteractiveCardShell): string {
  return TRN_INTERACTIVE_CARD_SHELL_CLASS[shell];
}
