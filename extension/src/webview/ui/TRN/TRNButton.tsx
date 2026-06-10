import type { ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import {
  TRN_HINT_HOVER_DELAY_MS,
  TRN_HINT_POPOVER_PANEL_CLASS,
} from "./TRNHintText.js";
import { TRNTooltip, type TRNTooltipPlacement } from "./TRNTooltip.js";
import {
  TRN_COMPACT_CHOICE_BUTTON_BASE,
  TRN_COMPACT_CHOICE_BUTTON_SIZE,
  trnCompactChoiceButtonTone,
} from "./trnCompactChoiceButtonClasses.js";

type TRNButtonProps = {
  children: ReactNode;
  selected?: boolean;
  size?: "default" | "compact";
  className?: string;
  /** UI-only prop, not forwarded to DOM */
  prefixIcon?: ReactNode;
  /**
   * Rich hover hint via {@link TRNTooltip} (shared hint panel chrome).
   * Do **not** use the native `title` attribute for operator copy — it is ignored when `hint` is set.
   */
  hint?: ReactNode;
  hintPlacement?: TRNTooltipPlacement;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function TRNButton({
  children,
  selected = false,
  size = "default",
  className = "",
  disabled,
  prefixIcon,
  hint,
  hintPlacement = "top-start",
  title,
  ...props
}: TRNButtonProps) {
  const flexLayout = pickFlexLayoutClasses(className);
  const heightLayout = pickHeightLayoutClasses(className);
  const innerLayout = pickButtonInnerLayoutClasses(className);
  const fillHeight =
    heightLayout.includes("h-full") || heightLayout.includes("self-stretch");
  const hasFlexibleHeight =
    heightLayout.includes("h-auto") || /\bmin-h-\S+/.test(heightLayout);
  const isMultilineHintButton =
    hint != null && (hasFlexibleHeight || innerLayout.includes("flex-col"));
  const sizeClass =
    size === "compact"
      ? fillHeight || isMultilineHintButton
        ? twMerge(
            "min-h-0 min-w-10 px-2 text-xs font-medium",
            isMultilineHintButton && "h-full w-full",
          )
        : TRN_COMPACT_CHOICE_BUTTON_SIZE
      : fillHeight || isMultilineHintButton
        ? twMerge(
            "min-h-0 min-w-12 px-3 text-sm font-semibold",
            isMultilineHintButton && "h-full w-full",
          )
        : "h-8 min-w-12 px-3 text-sm font-semibold";
  const toneClass = trnCompactChoiceButtonTone(selected, disabled === true);

  const buttonClassName = twMerge(
    TRN_COMPACT_CHOICE_BUTTON_BASE,
    sizeClass,
    toneClass,
    hint != null ? "w-full" : "",
    hint != null ? stripOuterLayoutClasses(className) : className,
    hint != null ? innerLayout : "",
  );

  const button = (
    <button
      type="button"
      disabled={disabled}
      className={buttonClassName}
      title={hint == null ? title : undefined}
      {...props}
    >
      {prefixIcon ? (
        <span className="mr-1 inline-flex shrink-0 items-center">{prefixIcon}</span>
      ) : null}
      {children}
    </button>
  );

  if (hint == null) {
    return button;
  }

  return (
    <TRNTooltip
      className={twMerge(
        "flex min-w-0 flex-1 self-stretch",
        flexLayout,
        heightLayout,
      )}
      triggerWrapper="span"
      trigger={button}
      triggerClassName={twMerge(
        "flex h-full w-full min-w-0 flex-1 self-stretch items-stretch p-0",
        flexLayout,
        heightLayout,
      )}
      triggerAriaLabel={typeof children === "string" ? `${children} — show hint` : "Show hint"}
      content={
        <div className="whitespace-pre-wrap text-left text-[11px] leading-relaxed text-zinc-100">
          {hint}
        </div>
      }
      panelClassName={twMerge(
        TRN_HINT_POPOVER_PANEL_CLASS,
        "max-w-[min(320px,calc(100vw-48px))]",
      )}
      placement={hintPlacement}
      openDelayMs={TRN_HINT_HOVER_DELAY_MS}
      disableHoverFx
    />
  );
}

const FLEX_LAYOUT_CLASS =
  /^(flex-1|flex-auto|flex-initial|flex-none|grow(?:-\d+)?|shrink(?:-\d+)?|min-w-\S+|max-w-\S+|w-full|basis-\S+)$/;

const HEIGHT_LAYOUT_CLASS =
  /^(h-full|h-auto|h-\S+|min-h-\S+|max-h-\S+|self-stretch|self-auto|items-stretch|items-center)$/;

/** Stays on the inner `<button>` when a hint tooltip wraps it (multi-line rows). */
const BUTTON_INNER_LAYOUT_CLASS =
  /^(flex-col|flex-row|items-start|items-end|justify-start|justify-center|justify-between|gap-\S+|text-left|text-center|text-right|py-\S+|leading-tight|leading-snug|font-normal|font-medium)$/;

function pickFlexLayoutClasses(className: string): string {
  return className
    .split(/\s+/)
    .filter((token) => FLEX_LAYOUT_CLASS.test(token))
    .join(" ");
}

function pickHeightLayoutClasses(className: string): string {
  return className
    .split(/\s+/)
    .filter((token) => HEIGHT_LAYOUT_CLASS.test(token))
    .join(" ");
}

function pickButtonInnerLayoutClasses(className: string): string {
  return className
    .split(/\s+/)
    .filter((token) => BUTTON_INNER_LAYOUT_CLASS.test(token))
    .join(" ");
}

function stripOuterLayoutClasses(className: string): string {
  return className
    .split(/\s+/)
    .filter(
      (token) =>
        token.length > 0 &&
        !FLEX_LAYOUT_CLASS.test(token) &&
        !HEIGHT_LAYOUT_CLASS.test(token) &&
        !BUTTON_INNER_LAYOUT_CLASS.test(token),
    )
    .join(" ");
}
