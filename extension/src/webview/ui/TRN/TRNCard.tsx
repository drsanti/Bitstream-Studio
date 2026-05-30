import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type TRNCardMode = "simple" | "animated";
export type TRNGlassPreset = "soft" | "medium" | "strong";

export type TRNCardProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  icon?: ReactNode;
  /** Rendered after the title inside the header title row (e.g. status badge). */
  titleTrailing?: ReactNode;
  /** Applied to the icon container (defaults to muted zinc). */
  iconWrapperClassName?: string;
  children: ReactNode;
  mode?: TRNCardMode;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (next: boolean) => void;
  collapsible?: boolean;
  disabled?: boolean;
  durationMs?: number;
  easing?: string;
  animateOpacity?: boolean;
  collapsedHeight?: number;
  rightSlot?: ReactNode;
  headerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  toggleOnHeaderClick?: boolean;
  glass?: boolean;
  glassPreset?: TRNGlassPreset;
};

export const TRNCard = forwardRef<HTMLDivElement, TRNCardProps>(
  function TRNCard(props, ref) {
    const {
      title,
      icon,
      titleTrailing,
      iconWrapperClassName,
      children,
      mode = "simple",
      expanded,
      defaultExpanded = true,
      onExpandedChange,
      collapsible = true,
      disabled = false,
      durationMs = 220,
      easing = "cubic-bezier(0.22, 1, 0.36, 1)",
      animateOpacity = true,
      collapsedHeight = 0,
      rightSlot,
      className,
      headerClassName,
      contentClassName,
      titleClassName,
      toggleOnHeaderClick = true,
      glass = false,
      glassPreset = "medium",
      ...divProps
    } = props;

    const isControlled = expanded != null;
    const [uncontrolledExpanded, setUncontrolledExpanded] =
      useState(defaultExpanded);
    const isExpanded = isControlled
      ? (expanded as boolean)
      : uncontrolledExpanded;

    const contentInnerRef = useRef<HTMLDivElement>(null);
    const [measuredHeight, setMeasuredHeight] = useState(0);

    useEffect(() => {
      if (contentInnerRef.current == null) {
        return;
      }
      const element = contentInnerRef.current;
      const updateHeight = () => {
        setMeasuredHeight(element.scrollHeight);
      };
      updateHeight();
      const observer = new ResizeObserver(() => {
        updateHeight();
      });
      observer.observe(element);
      return () => observer.disconnect();
    }, [children, isExpanded]);

    const setExpanded = (next: boolean) => {
      if (!isControlled) {
        setUncontrolledExpanded(next);
      }
      onExpandedChange?.(next);
    };

    const canToggle = collapsible && !disabled;
    const showHeaderDivider = mode === "simple"
      ? isExpanded
      : isExpanded || collapsedHeight > 0;

    const contentStyle = useMemo(() => {
      if (mode !== "animated") {
        return undefined;
      }
      return {
        maxHeight: isExpanded
          ? Math.max(measuredHeight, collapsedHeight)
          : collapsedHeight,
        opacity: animateOpacity ? (isExpanded ? 1 : 0) : 1,
        transitionProperty: "max-height, opacity",
        transitionDuration: `${durationMs}ms`,
        transitionTimingFunction: easing,
      };
    }, [
      animateOpacity,
      collapsedHeight,
      durationMs,
      easing,
      isExpanded,
      measuredHeight,
      mode,
    ]);

    const shellGlassClass =
      glassPreset === "soft"
        ? "border-zinc-700/85 bg-zinc-900/70 backdrop-blur-sm"
        : glassPreset === "strong"
          ? "border-zinc-700/70 bg-zinc-900/32 backdrop-blur-lg"
          : "border-zinc-700/80 bg-zinc-900/55 backdrop-blur-md";
    const headerGlassClass =
      glassPreset === "soft"
        ? "from-zinc-900/70 to-zinc-800/55"
        : glassPreset === "strong"
          ? "from-zinc-900/40 to-zinc-800/28"
          : "from-zinc-900/60 to-zinc-800/45";

    return (
      <div
        ref={ref}
        className={
          "relative overflow-hidden rounded-md border shadow-[0_8px_24px_rgba(0,0,0,0.35)] " +
          (glass ? shellGlassClass : "border-zinc-700/80 bg-zinc-950/85 ") +
          (className ?? "")
        }
        {...divProps}
      >
        <div
          className={
            "flex min-w-0 flex-nowrap items-center gap-2 bg-linear-to-r px-3 py-0.5 " +
            (glass ? `${headerGlassClass} ` : "from-zinc-900/95 to-zinc-800/75 ") +
            (showHeaderDivider ? "border-b border-zinc-700/80 " : "") +
            (disabled ? "opacity-60" : "") +
            (headerClassName != null ? ` ${headerClassName}` : "")
          }
        >
          {icon ? (
            <span
              className={
                "inline-flex shrink-0 items-center justify-center " + (iconWrapperClassName ?? "text-zinc-400")
              }
            >
              {icon}
            </span>
          ) : null}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              className={
                // No flex-1: otherwise short titles leave a huge gap before titleTrailing (e.g. badge).
                "min-w-0 shrink overflow-hidden text-left " +
                (canToggle && toggleOnHeaderClick
                  ? "cursor-pointer"
                  : "cursor-default")
              }
              onClick={() => {
                if (!canToggle || !toggleOnHeaderClick) {
                  return;
                }
                setExpanded(!isExpanded);
              }}
              disabled={disabled}
              aria-expanded={isExpanded}
              aria-label={
                collapsible
                  ? `${isExpanded ? "Collapse" : "Expand"} ${title}`
                  : title
              }
            >
              <span className={"block min-w-0 truncate text-xs font-semibold " + (titleClassName ?? "")}>
                {title}
              </span>
            </button>
            {titleTrailing != null ? (
              <span className="inline-flex shrink-0 items-center">{titleTrailing}</span>
            ) : null}
          </div>
          {rightSlot != null ? (
            <span className="inline-flex shrink-0 items-center gap-1">{rightSlot}</span>
          ) : null}
          {collapsible ? (
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center p-1"
              onClick={() => {
                if (!canToggle) {
                  return;
                }
                setExpanded(!isExpanded);
              }}
              disabled={!canToggle}
              aria-label={isExpanded ? "Collapse card" : "Expand card"}
              aria-expanded={isExpanded}
            >
              <ChevronDown
                className="h-3.5 w-3.5 transition-transform duration-200 ease-out"
                style={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
          ) : null}
        </div>

        {mode === "simple" ? (
          isExpanded ? (
            <div className={"px-3 py-2 " + (contentClassName ?? "")}>
              {children}
            </div>
          ) : null
        ) : isExpanded ? (
          <div
            className={"overflow-hidden " + (contentClassName ?? "")}
            style={contentStyle}
            aria-hidden={false}
          >
            <div ref={contentInnerRef} className="px-3 py-2">
              {children}
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);
