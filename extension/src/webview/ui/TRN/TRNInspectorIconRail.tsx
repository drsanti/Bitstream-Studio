import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export type TRNInspectorIconRailItem<T extends string = string> = {
  id: T;
  label: string;
  Icon: LucideIcon;
};

export type TRNInspectorIconRailTone = "emerald" | "zinc";

export type TRNInspectorIconRailProps<T extends string = string> = Omit<
  HTMLAttributes<HTMLElement>,
  "children"
> & {
  items: readonly TRNInspectorIconRailItem<T>[];
  activeId: T;
  onActiveChange: (id: T) => void;
  /** Pass-through for `<nav aria-label={…}>`. */
  ariaLabel: string;
  /** Selected-tab styling preset (default emerald for Sensor Studio inspector). */
  tone?: TRNInspectorIconRailTone;
  /**
   * Which edge the rail is visually docked to.
   * - `left` (default): rail is on the left side of the content, draws a right border.
   * - `right`: rail is on the right side of the content, draws a left border (mirrors padding).
   */
  dockSide?: "left" | "right";
  /**
   * When true (default), adds `nodrag` / `nopan` / `nowheel` and stops propagation so
   * nested canvases (e.g. React Flow) do not capture clicks intended for the rail.
   */
  reactFlowSafe?: boolean;
  /** Overrides the per-button className (size/padding). */
  itemClassName?: string;
  /**
   * Merged after tone `active` classes when the tab is selected.
   * Use to override active background, shadow, etc.
   */
  activeItemClassName?: string;
  /**
   * Merged after default inactive classes when the tab is not selected.
   * Use to override inactive background, hover, etc.
   */
  inactiveItemClassName?: string;
  /** Wraps the list of items in a column container (offset, padding, etc). */
  itemsContainerClassName?: string;
};

const TONE_CLASSES: Record<
  TRNInspectorIconRailTone,
  { active: string; inactiveFocus: string; navBorder: string }
> = {
  emerald: {
    active:
      "border-emerald-400/45 bg-emerald-950/40 text-emerald-100 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.12)]",
    inactiveFocus: "focus-visible:ring-emerald-400/35",
    navBorder: "border-emerald-900/30",
  },
  zinc: {
    active:
      "border-zinc-400/45 bg-zinc-800/55 text-zinc-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
    inactiveFocus: "focus-visible:ring-zinc-400/35",
    navBorder: "border-zinc-700/45",
  },
};

/**
 * Blender-style vertical icon strip: one icon per sub-panel, toggles `activeId`.
 */
export function TRNInspectorIconRail<T extends string = string>(
  props: TRNInspectorIconRailProps<T>,
) {
  const {
    items,
    activeId,
    onActiveChange,
    ariaLabel,
    tone = "emerald",
    dockSide = "left",
    reactFlowSafe = true,
    itemClassName,
    activeItemClassName,
    inactiveItemClassName,
    itemsContainerClassName,
    className,
    ...rest
  } = props;

  const tc = TONE_CLASSES[tone];
  const isDockRight = dockSide === "right";

  return (
    <nav
      {...rest}
      aria-label={ariaLabel}
      className={twMerge(
        "flex w-[42px] shrink-0 flex-col gap-0.5 mt-1 pb-1",
        isDockRight ? "pr-1 pl-0.5" : "pl-1 pr-0.5",
        reactFlowSafe ? "nodrag nopan nowheel" : null,
        isDockRight
          ? `border-l bg-zinc-950/90 ${tc.navBorder}`
          : `border-r bg-zinc-950/90 ${tc.navBorder}`,
        className,
      )}
    >
      <div className={twMerge("flex flex-col gap-0.5", itemsContainerClassName)}>
        {items.map(({ id, label, Icon }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={active}
              className={twMerge(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                itemClassName,
                tc.inactiveFocus,
                active
                  ? tc.active
                  : "border-transparent bg-transparent text-zinc-400 hover:border-zinc-600/50 hover:bg-zinc-800/40 hover:text-zinc-100",
                active ? activeItemClassName : inactiveItemClassName,
              )}
              onPointerDownCapture={
                reactFlowSafe
                  ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  : undefined
              }
              onClick={
                reactFlowSafe
                  ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onActiveChange(id);
                    }
                  : () => {
                      onActiveChange(id);
                    }
              }
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
