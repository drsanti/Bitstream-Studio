import {
  GlassButton,
  type GlassButtonColor,
  type GlassButtonProps,
} from "../components/common/GlassButton.js";

/**
 * TRN wrapper for legacy glass button styling.
 * Keeps existing behavior while allowing gradual migration into TRN primitives.
 * Supports TRN-style `tone` names while remaining backward compatible with `color`.
 */
export type TRNGlassButtonTone =
  | "neutral"
  | "info"
  | "danger"
  | "success"
  | "warning"
  | "accent";

export type TRNGlassButtonSize = "compact" | "default" | "control";

export type TRNGlassButtonProps = GlassButtonProps & {
  /** Prefer `tone` for TRN naming; `color` is still supported and takes precedence. */
  tone?: TRNGlassButtonTone;
  /** TRN alias for size (`compact`/`default`/`control`) while preserving legacy `size`. */
  trnSize?: TRNGlassButtonSize;
};

const toneToColorMap: Record<TRNGlassButtonTone, GlassButtonColor> = {
  neutral: "gray",
  info: "blue",
  danger: "red",
  success: "emerald",
  warning: "amber",
  accent: "violet",
};

function resolveSize(
  size: NonNullable<GlassButtonProps["size"]> | TRNGlassButtonSize | undefined,
): NonNullable<GlassButtonProps["size"]> {
  if (size === "compact") {
    return "sm";
  }
  if (size === "default") {
    return "md";
  }
  if (size === "control" || size === "sm" || size === "md") {
    return size;
  }
  return "sm";
}

export function TRNGlassButton(props: TRNGlassButtonProps) {
  const { tone = "neutral", color, size, trnSize, ...rest } = props;
  return (
    <GlassButton
      {...rest}
      color={color ?? toneToColorMap[tone]}
      size={resolveSize(trnSize ?? size ?? "sm")}
    />
  );
}
