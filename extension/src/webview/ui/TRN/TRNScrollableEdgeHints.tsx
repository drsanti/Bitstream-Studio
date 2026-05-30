import { ArrowLeftRight, ArrowUpDown } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import React, { useEffect, useMemo, useRef, useState } from "react";

export type TRNScrollableEdgeHintsProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: ReactNode;
  /** If true, hides scrollbars but keeps scrolling. Default: true. */
  hideScrollbar?: boolean;
  /** Edge blur height in px. Default: 22. */
  edgeSizePx?: number;
  /** If true, show top/bottom hints. Default: true. */
  showHints?: boolean;
  /** Extra class on the inner scrollable element. */
  scrollClassName?: string;
};

type ScrollState = {
  canScrollUp: boolean;
  canScrollDown: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
};

/** Sub-pixel scroll metrics can flip at 1px; use a small epsilon to avoid hint flicker loops. */
const SCROLL_EDGE_EPS_PX = 2;

const SCROLL_STATE_IDLE: ScrollState = {
  canScrollUp: false,
  canScrollDown: false,
  canScrollLeft: false,
  canScrollRight: false,
};

function scrollStateEqual(a: ScrollState, b: ScrollState): boolean {
  return (
    a.canScrollUp === b.canScrollUp &&
    a.canScrollDown === b.canScrollDown &&
    a.canScrollLeft === b.canScrollLeft &&
    a.canScrollRight === b.canScrollRight
  );
}

function getScrollState(el: HTMLElement | null): ScrollState {
  if (!el) {
    return SCROLL_STATE_IDLE;
  }
  const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
  const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
  const canScrollUp = el.scrollTop > SCROLL_EDGE_EPS_PX;
  const canScrollDown = el.scrollTop < maxScrollTop - SCROLL_EDGE_EPS_PX;
  const canScrollLeft = el.scrollLeft > SCROLL_EDGE_EPS_PX;
  const canScrollRight = el.scrollLeft < maxScrollLeft - SCROLL_EDGE_EPS_PX;
  return { canScrollUp, canScrollDown, canScrollLeft, canScrollRight };
}

export function TRNScrollableEdgeHints({
  children,
  hideScrollbar = true,
  edgeSizePx = 22,
  showHints = true,
  className,
  scrollClassName,
  ...rest
}: TRNScrollableEdgeHintsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<ScrollState>(SCROLL_STATE_IDLE);
  const [state, setState] = useState<ScrollState>(SCROLL_STATE_IDLE);

  const edgeStyle = useMemo(
    () =>
      ({
        ["--trn-edge-size" as never]: `${Math.max(8, Math.floor(edgeSizePx))}px`,
      }) as React.CSSProperties,
    [edgeSizePx],
  );

  const update = React.useCallback(() => {
    const next = getScrollState(scrollRef.current);
    if (scrollStateEqual(stateRef.current, next)) {
      return;
    }
    stateRef.current = next;
    setState(next);
  }, []);

  const scheduleUpdate = React.useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      update();
    });
  }, [update]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    scheduleUpdate();

    const onScroll = () => scheduleUpdate();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => scheduleUpdate());
    ro.observe(el);

    /* Content height changes (e.g. live telemetry) — do not depend on `children` identity. */
    const mo = new MutationObserver(() => scheduleUpdate());
    mo.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      mo.disconnect();
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [scheduleUpdate]);

  const topHintVisible = showHints && state.canScrollUp;
  const bottomHintVisible = showHints && state.canScrollDown;
  const leftHintVisible = showHints && state.canScrollLeft;
  const rightHintVisible = showHints && state.canScrollRight;

  return (
    <div
      className={["relative flex min-h-0 min-w-0 flex-col", className].filter(Boolean).join(" ")}
      style={edgeStyle}
      {...rest}
    >
      <div
        ref={scrollRef}
        className={[
          "min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain outline-none",
          hideScrollbar ? "scrollbar-hide" : undefined,
          scrollClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>

      {/* Edge fades */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-x-0 top-0 h-(--trn-edge-size)",
          "bg-linear-to-b from-black/55 to-transparent",
          topHintVisible ? "opacity-100" : "opacity-0",
          "transition-opacity duration-150",
        ].join(" ")}
      />
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-x-0 bottom-0 h-(--trn-edge-size)",
          "bg-linear-to-t from-black/55 to-transparent",
          bottomHintVisible ? "opacity-100" : "opacity-0",
          "transition-opacity duration-150",
        ].join(" ")}
      />
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-y-0 left-0 w-(--trn-edge-size)",
          "bg-linear-to-r from-black/55 to-transparent",
          leftHintVisible ? "opacity-100" : "opacity-0",
          "transition-opacity duration-150",
        ].join(" ")}
      />
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-y-0 right-0 w-(--trn-edge-size)",
          "bg-linear-to-l from-black/55 to-transparent",
          rightHintVisible ? "opacity-100" : "opacity-0",
          "transition-opacity duration-150",
        ].join(" ")}
      />

      {/* Hint chevrons */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-center",
          topHintVisible ? "opacity-100" : "opacity-0",
          "transition-opacity duration-150",
        ].join(" ")}
      >
        <div
          className={[
            "mt-0.5 flex h-(--trn-edge-size) items-center justify-center",
            "rounded-full border border-white/12 bg-black/35 px-2",
            "text-zinc-50/85 drop-shadow-[0_3px_16px_rgba(0,0,0,0.85)]",
            "motion-safe:animate-[trnScrollHintUp_1.15s_ease-in-out_infinite]",
          ].join(" ")}
        >
          <ArrowUpDown size={16} />
        </div>
      </div>
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center",
          bottomHintVisible ? "opacity-100" : "opacity-0",
          "transition-opacity duration-150",
        ].join(" ")}
      >
        <div
          className={[
            "mb-0.5 flex h-(--trn-edge-size) items-center justify-center",
            "rounded-full border border-white/12 bg-black/35 px-2",
            "text-zinc-50/85 drop-shadow-[0_3px_16px_rgba(0,0,0,0.85)]",
            "motion-safe:animate-[trnScrollHintDown_1.15s_ease-in-out_infinite]",
          ].join(" ")}
        >
          <ArrowUpDown size={16} />
        </div>
      </div>

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-y-0 left-0 flex items-center justify-start",
          leftHintVisible ? "opacity-100" : "opacity-0",
          "transition-opacity duration-150",
        ].join(" ")}
      >
        <div
          className={[
            "ml-0.5 flex w-(--trn-edge-size) items-center justify-center",
            "rounded-full border border-white/12 bg-black/35 py-2",
            "text-zinc-50/85 drop-shadow-[0_3px_16px_rgba(0,0,0,0.85)]",
            "motion-safe:animate-[trnScrollHintLeft_1.15s_ease-in-out_infinite]",
          ].join(" ")}
        >
          <ArrowLeftRight size={16} />
        </div>
      </div>

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-y-0 right-0 flex items-center justify-end",
          rightHintVisible ? "opacity-100" : "opacity-0",
          "transition-opacity duration-150",
        ].join(" ")}
      >
        <div
          className={[
            "mr-0.5 flex w-(--trn-edge-size) items-center justify-center",
            "rounded-full border border-white/12 bg-black/35 py-2",
            "text-zinc-50/85 drop-shadow-[0_3px_16px_rgba(0,0,0,0.85)]",
            "motion-safe:animate-[trnScrollHintRight_1.15s_ease-in-out_infinite]",
          ].join(" ")}
        >
          <ArrowLeftRight size={16} />
        </div>
      </div>
    </div>
  );
}

