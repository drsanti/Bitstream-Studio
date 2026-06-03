/*******************************************************************************
 * File Name        : trnInputClasses.ts
 *
 * Description      : Shared Tailwind class tokens for TRNInput chrome and control.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type TRNInputVariant = "ghost" | "outlined";
export type TRNInputSize = "sm" | "md";

/** Borderless native input (focus ring lives on the row chrome). */
export const TRN_INPUT_CONTROL_CLASS =
  "min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none outline-none ring-0 placeholder:text-zinc-500 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0";

export function trnInputRowClass(
  variant: TRNInputVariant,
  size: TRNInputSize,
  invalid: boolean,
  disabled: boolean,
): string {
  const sizePad = size === "sm" ? "px-2 py-0" : "px-2.5 py-0.5";
  const ghostRow =
    "flex items-center gap-2 rounded-md transition-colors focus-within:bg-zinc-800/55";
  const outlinedRow =
    "flex items-center gap-2 rounded-md border border-zinc-700/80 bg-zinc-900/80 transition-colors focus-within:border-zinc-600/90 focus-within:bg-zinc-800/55";
  const variantRow = variant === "outlined" ? outlinedRow : ghostRow;
  const ghostBg = variant === "ghost" ? "bg-zinc-900/45" : "";
  const invalidRow = invalid ? "border-rose-500/50 focus-within:border-rose-500/60" : "";
  const disabledRow = disabled ? "opacity-50" : "";

  return [variantRow, ghostBg, sizePad, invalidRow, disabledRow].filter(Boolean).join(" ");
}

export function trnInputTextSizeClass(size: TRNInputSize): string {
  return size === "sm" ? "text-xs py-1.5" : "text-sm py-2";
}
