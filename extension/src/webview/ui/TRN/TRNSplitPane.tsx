import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type SplitDirection = "horizontal" | "vertical";

type SplitSizeUnit = "ratio" | "px";

type SplitSize = {
  value: number;
  unit: SplitSizeUnit;
};

export type TRNSplitPaneProps = {
  direction?: SplitDirection;
  defaultSize?: number;
  size?: number;
  onSizeChange?: (next: number) => void;
  minPrimaryPx?: number;
  minSecondaryPx?: number;
  dividerSizePx?: number;
  persistKey?: string;
  animated?: boolean;
  animationDurationMs?: number;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
  primary: ReactNode;
  secondary: ReactNode;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toStoredSize(value: number): SplitSize {
  if (Number.isFinite(value) && value > 1) {
    return { value, unit: "px" };
  }
  return { value: clamp(value, 0.05, 0.95), unit: "ratio" };
}

function readPersistedSize(key: string): SplitSize | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) {
      return null;
    }
    const parsed = JSON.parse(raw) as SplitSize;
    if (
      typeof parsed?.value === "number" &&
      (parsed.unit === "px" || parsed.unit === "ratio")
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function TRNSplitPane(props: TRNSplitPaneProps) {
  const {
    direction = "horizontal",
    defaultSize = 0.5,
    size,
    onSizeChange,
    minPrimaryPx = 160,
    minSecondaryPx = 160,
    dividerSizePx = 8,
    persistKey,
    animated = true,
    animationDurationMs = 180,
    className,
    primaryClassName,
    secondaryClassName,
    primary,
    secondary,
  } = props;
  const isControlled = size != null;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    startCoord: number;
    startPx: number;
  } | null>(null);
  const [internalStoredSize, setInternalStoredSize] = useState<SplitSize>(() =>
    toStoredSize(defaultSize),
  );

  useEffect(() => {
    if (persistKey == null) {
      return;
    }
    const persisted = readPersistedSize(persistKey);
    if (persisted != null) {
      setInternalStoredSize(persisted);
    }
  }, [persistKey]);

  const effectiveStoredSize = useMemo<SplitSize>(
    () => (isControlled ? toStoredSize(size as number) : internalStoredSize),
    [internalStoredSize, isControlled, size],
  );

  const updateSize = (next: number) => {
    if (!isControlled) {
      const stored = toStoredSize(next);
      setInternalStoredSize(stored);
      if (persistKey != null) {
        window.localStorage.setItem(persistKey, JSON.stringify(stored));
      }
    }
    onSizeChange?.(next);
  };

  const computePrimaryPx = (containerPx: number): number => {
    if (effectiveStoredSize.unit === "px") {
      return effectiveStoredSize.value;
    }
    return containerPx * effectiveStoredSize.value;
  };

  const getContainerSizePx = (): number => {
    if (containerRef.current == null) {
      return 0;
    }
    const rect = containerRef.current.getBoundingClientRect();
    return direction === "horizontal" ? rect.width : rect.height;
  };

  useEffect(() => {
    const onPointerMove = (evt: PointerEvent) => {
      if (dragState.current == null) {
        return;
      }
      const containerPx = getContainerSizePx();
      if (containerPx <= 0) {
        return;
      }
      const nextCoord = direction === "horizontal" ? evt.clientX : evt.clientY;
      const delta = nextCoord - dragState.current.startCoord;
      const maxPrimary = Math.max(
        minPrimaryPx,
        containerPx - dividerSizePx - minSecondaryPx,
      );
      const nextPrimaryPx = clamp(
        dragState.current.startPx + delta,
        minPrimaryPx,
        maxPrimary,
      );
      const nextRatio = nextPrimaryPx / containerPx;
      updateSize(nextRatio);
    };

    const onPointerUp = () => {
      dragState.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [direction, dividerSizePx, minPrimaryPx, minSecondaryPx]);

  const containerPx = getContainerSizePx();
  const rawPrimaryPx = containerPx > 0 ? computePrimaryPx(containerPx) : 0;
  const maxPrimaryPx =
    containerPx > 0
      ? Math.max(minPrimaryPx, containerPx - dividerSizePx - minSecondaryPx)
      : minPrimaryPx;
  const primaryPx = clamp(rawPrimaryPx, minPrimaryPx, maxPrimaryPx);
  const secondaryPx = Math.max(0, containerPx - primaryPx - dividerSizePx);

  const paneTransition = animated
    ? `${animationDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
    : "0ms linear";

  const primaryStyle: CSSProperties =
    direction === "horizontal"
      ? { width: primaryPx, transition: `width ${paneTransition}` }
      : { height: primaryPx, transition: `height ${paneTransition}` };

  const secondaryStyle: CSSProperties =
    direction === "horizontal"
      ? { width: secondaryPx, transition: `width ${paneTransition}` }
      : { height: secondaryPx, transition: `height ${paneTransition}` };

  return (
    <div
      ref={containerRef}
      className={
        "w-full h-full min-h-0 min-w-0 flex " +
        (direction === "horizontal" ? "flex-row" : "flex-col") +
        (className != null ? ` ${className}` : "")
      }
    >
      <section
        style={primaryStyle}
        className={"min-w-0 min-h-0 overflow-auto " + (primaryClassName ?? "")}
      >
        {primary}
      </section>
      <div
        role="separator"
        aria-orientation={direction}
        tabIndex={0}
        className={
          "relative shrink-0 select-none " +
          (direction === "horizontal"
            ? "cursor-col-resize"
            : "cursor-row-resize")
        }
        style={
          direction === "horizontal"
            ? { width: dividerSizePx }
            : { height: dividerSizePx }
        }
        onDoubleClick={() => updateSize(defaultSize)}
        onPointerDown={(evt) => {
          const containerSize = getContainerSizePx();
          const currentPrimary = containerSize > 0 ? computePrimaryPx(containerSize) : 0;
          dragState.current = {
            startCoord: direction === "horizontal" ? evt.clientX : evt.clientY,
            startPx: currentPrimary,
          };
          evt.preventDefault();
        }}
        onKeyDown={(evt) => {
          const containerSize = getContainerSizePx();
          if (containerSize <= 0) {
            return;
          }
          const currentPrimary = computePrimaryPx(containerSize);
          const step = evt.shiftKey ? 24 : 12;
          const maxPrimary = Math.max(
            minPrimaryPx,
            containerSize - dividerSizePx - minSecondaryPx,
          );
          if (
            (direction === "horizontal" && evt.key === "ArrowLeft") ||
            (direction === "vertical" && evt.key === "ArrowUp")
          ) {
            evt.preventDefault();
            updateSize(clamp(currentPrimary - step, minPrimaryPx, maxPrimary) / containerSize);
          }
          if (
            (direction === "horizontal" && evt.key === "ArrowRight") ||
            (direction === "vertical" && evt.key === "ArrowDown")
          ) {
            evt.preventDefault();
            updateSize(clamp(currentPrimary + step, minPrimaryPx, maxPrimary) / containerSize);
          }
          if (evt.key === "Home") {
            evt.preventDefault();
            updateSize(minPrimaryPx / containerSize);
          }
          if (evt.key === "End") {
            evt.preventDefault();
            updateSize(maxPrimary / containerSize);
          }
        }}
      >
        <div className="absolute inset-0 bg-zinc-700/70 hover:bg-cyan-500/40 transition-colors" />
      </div>
      <section
        style={secondaryStyle}
        className={"min-w-0 min-h-0 overflow-auto " + (secondaryClassName ?? "")}
      >
        {secondary}
      </section>
    </div>
  );
}
