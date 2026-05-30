import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { TRNInspectorIconRail, type TRNInspectorIconRailItem } from "./TRNInspectorIconRail";
import { TRNScrollableEdgeHints } from "./TRNScrollableEdgeHints";

type TRNIconRailSplitPaneSharedProps = {
  /** Which side the icon rail is visually docked to. */
  iconSide?: "left" | "right";
  /** Optional header above the scroll area. */
  header?: ReactNode;
  /** Scrollable content. */
  children: ReactNode;

  /** Visual + spacing overrides. */
  className?: string;
  /**
   * Extra class on the content "shell" (header + scroll area).
   * Useful to override the default rail gap padding (e.g. `pr-0`).
   */
  contentShellClassName?: string;
  contentClassName?: string;

  /** Class on the outer rail column wrapper (left/right icon strip). */
  railColumnClassName?: string;

  /** If true, hide scrollbar and show edge hints. Default true. */
  useScrollHints?: boolean;
  edgeHintSizePx?: number;
};

/** Built-in `TRNInspectorIconRail` wiring. */
export type TRNIconRailSplitPaneBuiltinRailProps<T extends string = string> =
  TRNIconRailSplitPaneSharedProps & {
    rail?: undefined;
    railAriaLabel: string;
    railItems: readonly TRNInspectorIconRailItem<T>[];
    railActiveId: T;
    onRailActiveChange: (id: T) => void;
    railTone?: Parameters<typeof TRNInspectorIconRail<T>>[0]["tone"];
    railItemClassName?: string;
    railItemsContainerClassName?: string;
    railClassName?: string;
  };

/** Replace the built-in rail with custom content (e.g. a host-specific tab strip). */
export type TRNIconRailSplitPaneCustomRailProps = TRNIconRailSplitPaneSharedProps & {
  rail: ReactNode;
};

export type TRNIconRailSplitPaneProps<T extends string = string> =
  | TRNIconRailSplitPaneBuiltinRailProps<T>
  | TRNIconRailSplitPaneCustomRailProps;

export function TRNIconRailSplitPane<T extends string = string>(
  props: TRNIconRailSplitPaneProps<T>,
) {
  const {
    iconSide = "right",
    header,
    children,
    className,
    contentShellClassName,
    contentClassName,
    railColumnClassName,
    useScrollHints = true,
    edgeHintSizePx = 22,
  } = props;

  const customRail =
    "rail" in props && props.rail != null
      ? (props as TRNIconRailSplitPaneCustomRailProps).rail
      : null;
  const builtinRail: TRNIconRailSplitPaneBuiltinRailProps<T> | null =
    customRail == null ? (props as TRNIconRailSplitPaneBuiltinRailProps<T>) : null;

  const isRight = iconSide === "right";
  // Space between content column and the rail.
  // Rail on right => pad-right on content; rail on left => pad-left on content.
  const shellPad = isRight ? "pl-0 pr-3" : "pl-3 pr-0";
  const railPad = isRight ? "pl-0.5 pr-1" : "pl-1 pr-0.5";

  return (
    <div
      className={twMerge("flex h-full min-h-0 w-full min-w-0 gap-0", className)}
      style={{ flexDirection: isRight ? "row-reverse" : "row" }}
    >
      {/* Icon container is always first in the DOM; flip visually with row-reverse. */}
      <div
        className={twMerge(
          "flex h-full shrink-0 flex-col bg-transparent",
          railColumnClassName,
        )}
      >
        {customRail != null ? (
          customRail
        ) : builtinRail != null ? (
          <TRNInspectorIconRail
            ariaLabel={builtinRail.railAriaLabel}
            items={builtinRail.railItems}
            activeId={builtinRail.railActiveId}
            onActiveChange={builtinRail.onRailActiveChange}
            tone={builtinRail.railTone ?? "emerald"}
            dockSide={isRight ? "right" : "left"}
            itemClassName={builtinRail.railItemClassName}
            itemsContainerClassName={builtinRail.railItemsContainerClassName}
            className={twMerge(
              "rounded-lg border-0 bg-transparent",
              railPad,
              builtinRail.railClassName,
            )}
          />
        ) : null}
      </div>

      <div
        className={twMerge(
          "flex h-full min-h-0 min-w-0 flex-1 flex-col bg-transparent",
          shellPad,
          contentShellClassName,
        )}
      >
        {header != null ? <div className="shrink-0">{header}</div> : null}

        {useScrollHints ? (
          <TRNScrollableEdgeHints
            edgeSizePx={edgeHintSizePx}
            className={twMerge("min-h-0 flex-1", contentClassName)}
            scrollClassName={twMerge("p-2", header != null ? "mt-0" : null)}
          >
            {children}
          </TRNScrollableEdgeHints>
        ) : (
          <div
            className={twMerge(
              "scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain p-2",
              contentClassName,
            )}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
