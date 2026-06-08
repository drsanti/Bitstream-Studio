import { useRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { useScrollContainerEdgeAutoScroll } from "../hooks/useScrollContainerEdgeAutoScroll";

export type TRNMenuPanelTone = "glass-dropdown" | "subtle" | "card";
export type TRNMenuItemTone = "glass-dropdown" | "subtle" | "card";

const PANEL_TONE_CLASS: Record<TRNMenuPanelTone, string> = {
  "glass-dropdown":
    "isolate w-full rounded-xl border border-white/15 bg-black/70 px-1.5 py-1.5 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.9)] backdrop-blur-2xl ring-1 ring-white/10 leading-normal",
  subtle:
    "isolate w-full rounded-lg border border-zinc-700/80 bg-zinc-950/95 p-1.5 shadow-lg leading-normal",
  card:
    "isolate w-full rounded-md border border-zinc-700/80 bg-black/40 p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] leading-normal",
};

const ITEM_TONE_CLASS: Record<TRNMenuItemTone, string> = {
  "glass-dropdown":
    "rounded-md border border-white/10 bg-white/5 text-zinc-100 hover:border-white/20 hover:bg-white/12",
  subtle:
    "rounded-md border border-zinc-700/70 bg-zinc-900/70 text-zinc-100 hover:border-zinc-600/80 hover:bg-zinc-800/70",
  card:
    "rounded-md border border-zinc-700/80 bg-black/30 text-zinc-100 hover:border-zinc-600/80 hover:bg-black/45",
};

/**
 * Selected row styling for glass listboxes (`TRNSelect`, rotation preview model/env menus).
 * Merged after base `TRNMenuItemButton` tone classes so border/background win.
 */
export const TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME =
  "border-cyan-500/45 bg-cyan-500/18 text-cyan-200 hover:border-cyan-500/50 hover:bg-cyan-500/22";

/** Overrides default `TRNMenuItemButton` vertical padding for dense listbox rows. */
export const TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME = "py-1 leading-tight";

export type TRNMenuPanelProps = HTMLAttributes<HTMLDivElement> & {
  tone?: TRNMenuPanelTone;
  /** Scroll when the pointer hovers the top/bottom edge (for `overflow-y-auto` + hidden scrollbar). */
  edgeAutoScroll?: boolean;
};

export type TRNMenuScrollRegionProps = HTMLAttributes<HTMLDivElement> & {
  /** Scroll when the pointer hovers the top/bottom edge (for `overflow-y-auto` + hidden scrollbar). */
  edgeAutoScroll?: boolean;
};

/** Scrollable menu body (place inside {@link TRNMenuPanel} when a sticky header e.g. search sits above). */
export function TRNMenuScrollRegion(props: TRNMenuScrollRegionProps) {
  const { className, edgeAutoScroll = false, children, ...rest } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollContainerEdgeAutoScroll(scrollRef, edgeAutoScroll);

  return (
    <div
      ref={scrollRef}
      className={twMerge("min-h-0 overflow-y-auto scrollbar-hide", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function TRNMenuPanel(props: TRNMenuPanelProps) {
  const { className, tone = "glass-dropdown", edgeAutoScroll = false, children, ...rest } =
    props;
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollContainerEdgeAutoScroll(scrollRef, edgeAutoScroll);

  return (
    <div ref={scrollRef} className={twMerge(PANEL_TONE_CLASS[tone], className)} {...rest}>
      {children}
    </div>
  );
}

export type TRNMenuItemButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  label: ReactNode;
  icon?: ReactNode;
  rightSlot?: ReactNode;
  tone?: TRNMenuItemTone;
};

export function TRNMenuItemButton(props: TRNMenuItemButtonProps) {
  const {
    label,
    icon,
    rightSlot,
    className,
    tone = "glass-dropdown",
    type = "button",
    ...rest
  } = props;

  return (
    <button
      type={type}
      className={twMerge(
        "flex h-auto w-full shrink-0 items-center justify-start gap-1.5 px-3.5 py-1.5 text-left text-sm font-normal leading-tight shadow-none transition-colors",
        ITEM_TONE_CLASS[tone],
        className,
      )}
      {...rest}
    >
      {icon ? <span className="inline-flex shrink-0 items-center">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {rightSlot ? <span className="inline-flex shrink-0 items-center">{rightSlot}</span> : null}
    </button>
  );
}

/** Vertical rhythm inside `TRNMenuPanel` and similar glass menus. */
export type TRNMenuSectionTitleSpacing =
  | "menuFirst"
  | "menuNext"
  | "settingsInset"
  | "hud"
  | "hudFollowUp"
  /** Typography only — use inside padded cards or toolbars where extra inset is unwanted. */
  | "labelOnly";

const SECTION_TITLE_BASE =
  "text-[10px] font-semibold uppercase tracking-wide text-zinc-500";

const SECTION_TITLE_SPACING: Record<TRNMenuSectionTitleSpacing, string> = {
  menuFirst: "shrink-0 px-2 pb-0.5 pt-1 leading-snug",
  menuNext: "shrink-0 px-2 pb-0.5 pt-2 leading-snug",
  settingsInset: "shrink-0 px-1 pb-0.5 pt-2 leading-snug",
  hud: "shrink-0 px-3 pb-1 pt-0.5 leading-snug",
  hudFollowUp:
    "shrink-0 mt-2 border-t border-white/8 px-3 pb-0.5 pt-2 leading-snug",
  labelOnly: "shrink-0 leading-snug",
};

export type TRNMenuSectionTitleProps = HTMLAttributes<HTMLDivElement> & {
  spacing?: TRNMenuSectionTitleSpacing;
};

/**
 * Small caps section label for TRN glass dropdowns and card menus.
 * Use `spacing="menuNext"` after the first block in a panel; `settingsInset` for titles inside a settings column;
 * `labelOnly` when the parent already provides padding (cards, inspector rows, asset browser previews).
 */
export function TRNMenuSectionTitle(props: TRNMenuSectionTitleProps) {
  const { className, spacing = "menuFirst", children, ...rest } = props;
  return (
    <div
      className={twMerge(
        SECTION_TITLE_BASE,
        SECTION_TITLE_SPACING[spacing],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
