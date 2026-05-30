import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TRNCardHeader } from "./TRNCardHeader.js";

export type TRNInteractiveCardProps = {
  title: ReactNode;
  titleLeadingSlot?: ReactNode;
  titleTrailingSlot?: ReactNode;
  children?: ReactNode;
  className?: string;
  headerClassName?: string;
  headerTitleClassName?: string;
  contentClassName?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (next: boolean) => void;
  animationDurationMs?: number;
  animationEasing?: string;
  /**
   * When collapsible, animates `max-height` from measured inner scroll height (default).
   * Set `false` when children use flex (`flex-1` / fill height); intrinsic measurement
   * caps height and breaks canvases and other stretch layouts.
   */
  collapsibleMeasureIntrinsic?: boolean;
};

export function TRNInteractiveCard(props: TRNInteractiveCardProps) {
  const {
    title,
    titleLeadingSlot,
    titleTrailingSlot,
    children,
    className = "",
    headerClassName = "",
    headerTitleClassName = "",
    contentClassName = "",
    collapsible = false,
    collapsed,
    defaultCollapsed = false,
    onCollapsedChange,
    animationDurationMs = 220,
    animationEasing = "cubic-bezier(0.22, 1, 0.36, 1)",
    collapsibleMeasureIntrinsic = true,
  } = props;

  const isCollapsedControlled = collapsed != null;
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const effectiveCollapsed = isCollapsedControlled
    ? (collapsed as boolean)
    : internalCollapsed;

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useEffect(() => {
    if (
      !collapsible ||
      !collapsibleMeasureIntrinsic ||
      contentRef.current == null
    ) {
      return;
    }
    const element = contentRef.current;
    const updateHeight = () => {
      setMeasuredHeight(element.scrollHeight);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children, collapsible, collapsibleMeasureIntrinsic, effectiveCollapsed]);

  const setCollapsed = (next: boolean) => {
    if (!isCollapsedControlled) {
      setInternalCollapsed(next);
    }
    onCollapsedChange?.(next);
  };

  const contentStyle: CSSProperties | undefined = useMemo(() => {
    if (!collapsible) {
      return undefined;
    }
    if (!collapsibleMeasureIntrinsic) {
      return {
        maxHeight: effectiveCollapsed ? 0 : undefined,
        opacity: effectiveCollapsed ? 0 : 1,
        transitionProperty: "max-height, opacity",
        transitionDuration: `${animationDurationMs}ms`,
        transitionTimingFunction: animationEasing,
        flex: effectiveCollapsed ? undefined : "1 1 0%",
        minHeight: 0,
      };
    }
    return {
      // Add a tiny safety buffer to avoid clipping the last 1px border
      // of inner rows when content is wrapped by overflow-hidden.
      maxHeight: effectiveCollapsed ? 0 : measuredHeight + 2,
      opacity: effectiveCollapsed ? 0 : 1,
      transitionProperty: "max-height, opacity",
      transitionDuration: `${animationDurationMs}ms`,
      transitionTimingFunction: animationEasing,
    };
  }, [
    animationDurationMs,
    animationEasing,
    collapsible,
    collapsibleMeasureIntrinsic,
    effectiveCollapsed,
    measuredHeight,
  ]);

  const collapseButton = collapsible ? (
    <button
      type="button"
      className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-transparent text-zinc-400 transition-colors hover:bg-zinc-800/80 hover:text-zinc-200"
      aria-label={effectiveCollapsed ? "Expand card" : "Collapse card"}
      onClick={() => setCollapsed(!effectiveCollapsed)}
    >
      <ChevronDown
        className="h-3.5 w-3.5 transition-transform duration-200 ease-out"
        strokeWidth={3}
        style={{
          transform: effectiveCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
        }}
        aria-hidden
      />
    </button>
  ) : null;
  const isCollapsedState = collapsible && effectiveCollapsed;
  const sectionClassName = twMerge(
    "flex min-h-0 flex-col rounded-md border border-zinc-700/80 bg-black/40 shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
    collapsible
      ? isCollapsedState
        ? "px-2 pt-1 pb-1"
        : "px-2 pt-1 pb-2"
      : "p-2",
    className,
  );
  /** Collapsed: no gap under header; collapsible cards keep header height identical (no extra py). */
  const headerCombinedClassName = twMerge(
    collapsible ? "py-0" : undefined,
    isCollapsedState ? "mb-0!" : undefined,
    headerClassName,
  );

  return (
    <section className={sectionClassName}>
      <TRNCardHeader
        title={title}
        leadingSlot={titleLeadingSlot}
        trailingSlot={
          <>
            {titleTrailingSlot != null ? titleTrailingSlot : null}
            {collapseButton}
          </>
        }
        className={headerCombinedClassName}
        titleClassName={headerTitleClassName}
      />
      {collapsible ? (
        <div
          className={twMerge(
            "min-h-0 overflow-hidden",
            effectiveCollapsed ? "pointer-events-none" : null,
          )}
          style={contentStyle}
          aria-hidden={effectiveCollapsed ? true : undefined}
        >
          {/*
            Padding / border-top / gaps belong on the inner panel only.
            If they sit on this outer wrapper, `max-height: 0` still leaves padding + border
            visible (~one spacing rhythm tall) when collapsed.
          */}
          <div
            ref={contentRef}
            className={twMerge(
              collapsibleMeasureIntrinsic ? undefined : "flex h-full min-h-0 flex-1 flex-col",
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>
      ) : (
        <div className={contentClassName}>{children}</div>
      )}
    </section>
  );
}
