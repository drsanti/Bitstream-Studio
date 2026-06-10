/** Shared chrome for TRN “field” controls — {@link TRNSelect} trigger, {@link TRNInlineToggleRow}, etc. */

export type TRNFieldControlVariant = "field" | "glass";
export type TRNFieldControlSize = "sm" | "md" | "lg";

export const TRN_FIELD_CONTROL_DEFAULT_VARIANT: TRNFieldControlVariant = "field";
export const TRN_FIELD_CONTROL_DEFAULT_SIZE: TRNFieldControlSize = "md";

export const TRN_FIELD_CONTROL_TRIGGER_BASE_CLASS =
  "font-sans text-[13px] font-normal leading-tight text-zinc-100 " +
  "shadow-[0_16px_48px_-16px_rgba(0,0,0,0.35)] backdrop-blur-2xl " +
  "transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const TRN_FIELD_CONTROL_BORDER_BG_CLASS =
  "border border-zinc-700/80 bg-zinc-950/45";

export const TRN_FIELD_CONTROL_FIELD_VARIANT_CLASS =
  `${TRN_FIELD_CONTROL_BORDER_BG_CLASS} hover:bg-zinc-950/55`;

export const TRN_FIELD_CONTROL_GLASS_VARIANT_CLASS =
  "border border-white/15 bg-black/70 ring-1 ring-white/10 hover:bg-black/80";

export const TRN_FIELD_CONTROL_SHADOW_BLUR_CLASS =
  "shadow-[0_16px_48px_-16px_rgba(0,0,0,0.35)] backdrop-blur-2xl";

export const TRN_FIELD_CONTROL_PADDING_MD_CLASS = "rounded-md px-2.5 py-1.5";

export const TRN_FIELD_CONTROL_LABEL_CLASS =
  "inline-flex items-center font-sans text-[13px] font-normal leading-tight text-zinc-100";

function fieldControlPaddingClass(size: TRNFieldControlSize): string {
  if (size === "sm") {
    return "rounded-md px-2.5 py-1";
  }
  if (size === "lg") {
    return "rounded-md px-2.5 py-2 text-sm";
  }
  return TRN_FIELD_CONTROL_PADDING_MD_CLASS;
}

/** Static field row shell — default {@link TRNInlineToggleRow} / {@link TRNSelect} `field` parity. */
export function trnFieldControlRowShellClass(args?: {
  variant?: TRNFieldControlVariant | "plain";
  size?: TRNFieldControlSize;
}): string {
  const variant = args?.variant ?? TRN_FIELD_CONTROL_DEFAULT_VARIANT;
  const size = args?.size ?? TRN_FIELD_CONTROL_DEFAULT_SIZE;
  if (variant === "plain") {
    return "";
  }
  const padding = fieldControlPaddingClass(size);
  const variantClass =
    variant === "glass"
      ? TRN_FIELD_CONTROL_GLASS_VARIANT_CLASS
      : TRN_FIELD_CONTROL_BORDER_BG_CLASS;
  return `${padding} ${variantClass} ${TRN_FIELD_CONTROL_SHADOW_BLUR_CLASS}`;
}

/** Default `field` + `md` row shell for {@link TRNInlineToggleRow}. */
export const TRN_FIELD_CONTROL_ROW_SHELL_CLASS = trnFieldControlRowShellClass();
