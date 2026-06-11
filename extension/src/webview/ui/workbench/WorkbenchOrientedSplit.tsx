import { useRef, useState, type ReactNode } from "react";
import { Splitter } from "./Splitter";

export type WorkbenchOrientedSplitDirection = "vertical" | "horizontal";

const DEFAULT_PRIMARY_RATIO = 0.45;
const MIN_PRIMARY_RATIO = 0.28;
const MIN_SECONDARY_RATIO = 0.22;

function clampPrimaryRatio(raw: number): number {
  return Math.max(MIN_PRIMARY_RATIO, Math.min(1 - MIN_SECONDARY_RATIO, raw));
}

export type WorkbenchOrientedSplitProps = {
  direction: WorkbenchOrientedSplitDirection;
  first: ReactNode;
  second: ReactNode;
  firstHeader?: ReactNode;
  secondHeader?: ReactNode;
  readPrimaryRatio: () => number;
  writePrimaryRatio: (ratio: number) => void;
};

export function WorkbenchOrientedSplit(props: WorkbenchOrientedSplitProps) {
  const {
    direction,
    first,
    second,
    firstHeader,
    secondHeader,
    readPrimaryRatio,
    writePrimaryRatio,
  } = props;
  const splitRef = useRef<HTMLDivElement>(null);
  const [primaryRatio, setPrimaryRatio] = useState(() => {
    const stored = readPrimaryRatio();
    return Number.isFinite(stored) ? clampPrimaryRatio(stored) : DEFAULT_PRIMARY_RATIO;
  });

  const secondaryRatio = 1 - primaryRatio;
  const isVertical = direction === "vertical";

  const onResize = (next: number) => {
    const clamped = clampPrimaryRatio(next);
    setPrimaryRatio(clamped);
    writePrimaryRatio(clamped);
  };

  return (
    <div
      ref={splitRef}
      className="grid min-h-0 flex-1 overflow-hidden"
      style={
        isVertical
          ? {
              gridTemplateRows: `minmax(96px, ${primaryRatio}fr) 10px minmax(120px, ${secondaryRatio}fr)`,
              gridTemplateColumns: "1fr",
            }
          : {
              gridTemplateColumns: `minmax(120px, ${primaryRatio}fr) 10px minmax(120px, ${secondaryRatio}fr)`,
              gridTemplateRows: "1fr",
            }
      }
    >
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        {firstHeader}
        {first}
      </div>

      <Splitter
        direction={isVertical ? "vertical" : "horizontal"}
        containerRef={splitRef}
        onResize={onResize}
      />

      <div
        className={`flex min-h-0 min-w-0 flex-col overflow-hidden ${
          isVertical ? "border-t border-zinc-800/80" : "border-l border-zinc-800/80"
        }`}
      >
        {secondHeader}
        {second}
      </div>
    </div>
  );
}
