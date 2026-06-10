import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { TRN_HINT_POPOVER_PANEL_CLASS } from "./TRNHintText.js";

/** Above workbench panes / orbit viewports; invalid `z-320` utility is not in Tailwind theme. */
const TRN_TOOLTIP_PANEL_Z_CLASS = "z-[1100]";

export type TRNTooltipPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "right"
  | "left";

export type TRNTooltipProps = {
  content: ReactNode;
  trigger: ReactNode;
  className?: string;
  panelClassName?: string;
  placement?: TRNTooltipPlacement;
  collisionPadding?: number;
  offsetPx?: number;
  showTriggerOnParentHover?: boolean;
  triggerClassName?: string;
  /** Override default `"Show hint"` on the trigger control for accessibility. */
  triggerAriaLabel?: string;
  /**
   * What element should wrap the trigger node.
   *
   * Default is `"button"` for accessibility, but when the trigger itself is a
   * `<button>` (e.g. `TRNIconButton`) you must use `"span"` to avoid invalid
   * nested buttons.
   */
  triggerWrapper?: "button" | "span";
  disableHoverFx?: boolean;
  openDelayMs?: number;
};

type TooltipPosition = {
  x: number;
  y: number;
  placement: TRNTooltipPlacement;
};

function computeCandidatePosition(
  placement: TRNTooltipPlacement,
  triggerRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  offsetPx: number,
): { x: number; y: number } {
  if (placement === "top") {
    return {
      x: triggerRect.left + (triggerRect.width - tooltipWidth) / 2,
      y: triggerRect.top - tooltipHeight - offsetPx,
    };
  }
  if (placement === "top-start") {
    return {
      x: triggerRect.left,
      y: triggerRect.top - tooltipHeight - offsetPx,
    };
  }
  if (placement === "top-end") {
    return {
      x: triggerRect.right - tooltipWidth,
      y: triggerRect.top - tooltipHeight - offsetPx,
    };
  }
  if (placement === "bottom") {
    return {
      x: triggerRect.left + (triggerRect.width - tooltipWidth) / 2,
      y: triggerRect.bottom + offsetPx,
    };
  }
  if (placement === "bottom-start") {
    return {
      x: triggerRect.left,
      y: triggerRect.bottom + offsetPx,
    };
  }
  if (placement === "bottom-end") {
    return {
      x: triggerRect.right - tooltipWidth,
      y: triggerRect.bottom + offsetPx,
    };
  }
  if (placement === "right") {
    return {
      x: triggerRect.right + offsetPx,
      y: triggerRect.top + (triggerRect.height - tooltipHeight) / 2,
    };
  }
  return {
    x: triggerRect.left - tooltipWidth - offsetPx,
    y: triggerRect.top + (triggerRect.height - tooltipHeight) / 2,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pickBestTooltipPosition(options: {
  preferredPlacement: TRNTooltipPlacement;
  triggerRect: DOMRect;
  tooltipWidth: number;
  tooltipHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  collisionPadding: number;
  offsetPx: number;
}): TooltipPosition {
  const {
    preferredPlacement,
    triggerRect,
    tooltipWidth,
    tooltipHeight,
    viewportWidth,
    viewportHeight,
    collisionPadding,
    offsetPx,
  } = options;
  const fallbackOrder: TRNTooltipPlacement[] = [
    preferredPlacement,
    "bottom",
    "bottom-start",
    "bottom-end",
    "top",
    "top-start",
    "top-end",
    "right",
    "left",
  ].filter((value, index, all) => all.indexOf(value) === index);

  let best: TooltipPosition | null = null;
  let bestVisibleArea = -1;

  for (const candidatePlacement of fallbackOrder) {
    const candidate = computeCandidatePosition(
      candidatePlacement,
      triggerRect,
      tooltipWidth,
      tooltipHeight,
      offsetPx,
    );
    const visibleLeft = Math.max(candidate.x, collisionPadding);
    const visibleTop = Math.max(candidate.y, collisionPadding);
    const visibleRight = Math.min(
      candidate.x + tooltipWidth,
      viewportWidth - collisionPadding,
    );
    const visibleBottom = Math.min(
      candidate.y + tooltipHeight,
      viewportHeight - collisionPadding,
    );
    const visibleWidth = Math.max(0, visibleRight - visibleLeft);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibleArea = visibleWidth * visibleHeight;
    const fullyVisible =
      visibleWidth >= tooltipWidth && visibleHeight >= tooltipHeight;

    if (fullyVisible) {
      return {
        x: clamp(
          candidate.x,
          collisionPadding,
          viewportWidth - collisionPadding - tooltipWidth,
        ),
        y: clamp(
          candidate.y,
          collisionPadding,
          viewportHeight - collisionPadding - tooltipHeight,
        ),
        placement: candidatePlacement,
      };
    }

    if (visibleArea > bestVisibleArea) {
      bestVisibleArea = visibleArea;
      best = {
        x: clamp(
          candidate.x,
          collisionPadding,
          viewportWidth - collisionPadding - tooltipWidth,
        ),
        y: clamp(
          candidate.y,
          collisionPadding,
          viewportHeight - collisionPadding - tooltipHeight,
        ),
        placement: candidatePlacement,
      };
    }
  }

  return (
    best ?? {
      x: collisionPadding,
      y: collisionPadding,
      placement: preferredPlacement,
    }
  );
}

export function TRNTooltip({
  content,
  trigger,
  className = "",
  panelClassName = "",
  placement = "top-end",
  collisionPadding = 8,
  offsetPx = 8,
  showTriggerOnParentHover = false,
  triggerClassName = "",
  triggerAriaLabel,
  triggerWrapper = "button",
  disableHoverFx = false,
  openDelayMs = 0,
}: TRNTooltipProps) {
  const tooltipId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openDelayTimeoutRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const panelStyle = useMemo(() => {
    if (!position) {
      return {
        left: -9999,
        top: -9999,
        visibility: "hidden" as const,
      };
    }
    return {
      left: position.x,
      top: position.y,
      visibility: "visible" as const,
    };
  }, [position]);

  useEffect(() => {
    return () => {
      if (openDelayTimeoutRef.current != null) {
        window.clearTimeout(openDelayTimeoutRef.current);
        openDelayTimeoutRef.current = null;
      }
    };
  }, []);

  const openWithDelay = () => {
    if (openDelayTimeoutRef.current != null) {
      window.clearTimeout(openDelayTimeoutRef.current);
      openDelayTimeoutRef.current = null;
    }
    if (openDelayMs <= 0) {
      setOpen(true);
      return;
    }
    openDelayTimeoutRef.current = window.setTimeout(() => {
      setOpen(true);
      openDelayTimeoutRef.current = null;
    }, openDelayMs);
  };

  const closeImmediately = () => {
    if (openDelayTimeoutRef.current != null) {
      window.clearTimeout(openDelayTimeoutRef.current);
      openDelayTimeoutRef.current = null;
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const root = rootRef.current;
      const panel = panelRef.current;
      if (root?.contains(target) || panel?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const updatePosition = () => {
      const triggerNode = triggerRef.current;
      const panelNode = panelRef.current;
      if (!triggerNode || !panelNode) {
        return;
      }
      const triggerRect = triggerNode.getBoundingClientRect();
      const panelRect = panelNode.getBoundingClientRect();
      const best = pickBestTooltipPosition({
        preferredPlacement: placement,
        triggerRect,
        tooltipWidth: panelRect.width,
        tooltipHeight: panelRect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        collisionPadding,
        offsetPx,
      });
      setPosition(best);
    };

    const schedulePosition = () => {
      updatePosition();
      requestAnimationFrame(() => {
        updatePosition();
      });
    };
    schedulePosition();
    window.addEventListener("resize", schedulePosition);
    window.addEventListener("scroll", schedulePosition, true);
    return () => {
      window.removeEventListener("resize", schedulePosition);
      window.removeEventListener("scroll", schedulePosition, true);
    };
  }, [collisionPadding, content, offsetPx, open, placement]);

  const hoverFxClassName = disableHoverFx
    ? ""
    : showTriggerOnParentHover
      ? "text-transparent opacity-0 group-hover:text-zinc-400 group-hover:opacity-100 group-focus-within:text-zinc-400 group-focus-within:opacity-100 hover:scale-105 hover:text-amber-300"
      : "text-zinc-400 hover:scale-105 hover:text-amber-300 group-hover:text-amber-300";

  const focusRingClassName = disableHoverFx
    ? "focus-visible:ring-1 focus-visible:ring-white/20"
    : "focus-visible:ring-1 focus-visible:ring-amber-300/60";

  const handleTriggerMouseOver = () => {
    openWithDelay();
  };

  const handleTriggerMouseOut = (event: ReactMouseEvent) => {
    const next = event.relatedTarget;
    const root = rootRef.current;
    const panel = panelRef.current;
    if (next instanceof Node && (root?.contains(next) || panel?.contains(next))) {
      return;
    }
    closeImmediately();
  };

  const handleRootPointerEnter = () => {
    openWithDelay();
  };

  const handleRootPointerLeave = (event: ReactMouseEvent) => {
    handleTriggerMouseOut(event);
  };

  const triggerCommonProps = {
    ref: triggerRef,
    "aria-label": triggerAriaLabel ?? "Show hint",
    "aria-expanded": open,
    "aria-controls": tooltipId,
    className: twMerge(
      "inline-flex items-center justify-center rounded-sm p-0.5 transition-all duration-150 focus:outline-none",
      focusRingClassName,
      hoverFxClassName,
      triggerClassName,
    ),
    onClick: () => setOpen((previous) => !previous),
    onFocus: openWithDelay,
    onBlur: closeImmediately,
    onMouseOver: handleTriggerMouseOver,
    onMouseOut: handleTriggerMouseOut,
    onPointerEnter: handleTriggerMouseOver,
    onPointerLeave: handleTriggerMouseOut,
  } as const;

  const tooltipPanel =
    open && typeof document !== "undefined" ? (
      <div
        ref={panelRef}
        id={tooltipId}
        role="tooltip"
        className={twMerge(
          "pointer-events-none fixed w-max max-w-[min(320px,calc(100vw-32px))] text-left",
          TRN_TOOLTIP_PANEL_Z_CLASS,
          TRN_HINT_POPOVER_PANEL_CLASS,
          panelClassName,
        )}
        style={panelStyle}
      >
        {content}
      </div>
    ) : null;

  return (
    <div
      ref={rootRef}
      className={twMerge("relative", className)}
      onPointerEnter={handleRootPointerEnter}
      onPointerLeave={handleRootPointerLeave}
      {...(showTriggerOnParentHover
        ? { onMouseEnter: openWithDelay, onMouseLeave: closeImmediately }
        : {})}
    >
      {triggerWrapper === "button" ? (
        <button {...triggerCommonProps} type="button">
          {trigger}
        </button>
      ) : (
        <span
          {...triggerCommonProps}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen((previous) => !previous);
            }
          }}
        >
          {trigger}
        </span>
      )}
      {tooltipPanel != null ? createPortal(tooltipPanel, document.body) : null}
    </div>
  );
}
