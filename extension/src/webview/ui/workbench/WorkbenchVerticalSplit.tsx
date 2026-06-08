import { useRef, useState, type ReactNode } from "react";
import { Splitter } from "./Splitter";

const DEFAULT_PRIMARY_RATIO = 0.58;
const MIN_PRIMARY_RATIO = 0.28;
const MIN_SECONDARY_RATIO = 0.22;

function clampPrimaryRatio(raw: number): number {
  return Math.max(MIN_PRIMARY_RATIO, Math.min(1 - MIN_SECONDARY_RATIO, raw));
}

export type WorkbenchVerticalSplitProps = {
  primary: ReactNode;
  secondary: ReactNode;
  /** Persisted split ratio for the primary (top) pane. */
  readPrimaryRatio: () => number;
  writePrimaryRatio: (ratio: number) => void;
  secondaryHeader?: ReactNode;
};

export function WorkbenchVerticalSplit(props: WorkbenchVerticalSplitProps) {
  const { primary, secondary, readPrimaryRatio, writePrimaryRatio, secondaryHeader } = props;
  const splitRef = useRef<HTMLDivElement>(null);
  const [primaryRatio, setPrimaryRatio] = useState(() => {
    const stored = readPrimaryRatio();
    return Number.isFinite(stored) ? clampPrimaryRatio(stored) : DEFAULT_PRIMARY_RATIO;
  });

  const secondaryRatio = 1 - primaryRatio;

  return (
    <div
      ref={splitRef}
      className="grid min-h-0 flex-1 overflow-hidden"
      style={{
        gridTemplateRows: `minmax(96px, ${primaryRatio}fr) 10px minmax(120px, ${secondaryRatio}fr)`,
        gridTemplateColumns: "1fr",
      }}
    >
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">{primary}</div>

      <Splitter
        direction="vertical"
        containerRef={splitRef}
        onResize={(next) => {
          const clamped = clampPrimaryRatio(next);
          setPrimaryRatio(clamped);
          writePrimaryRatio(clamped);
        }}
      />

      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-t border-zinc-800/80">
        {secondaryHeader}
        {secondary}
      </div>
    </div>
  );
}
