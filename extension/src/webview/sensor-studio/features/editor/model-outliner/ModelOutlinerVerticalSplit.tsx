import { useRef, useState, type ReactNode } from "react";
import { Splitter } from "../../../../ui/workbench/Splitter";
import {
  readStoredModelOutlinerTreeSplitRatio,
  writeStoredModelOutlinerTreeSplitRatio,
} from "./model-outliner-ui-persistence";

const MIN_TREE_RATIO = 0.28;
const MIN_PROPERTIES_RATIO = 0.22;

function clampTreeRatio(raw: number): number {
  return Math.max(MIN_TREE_RATIO, Math.min(1 - MIN_PROPERTIES_RATIO, raw));
}

export type ModelOutlinerVerticalSplitProps = {
  tree: ReactNode;
  properties: ReactNode;
};

export function ModelOutlinerVerticalSplit(props: ModelOutlinerVerticalSplitProps) {
  const { tree, properties } = props;
  const splitRef = useRef<HTMLDivElement>(null);
  const [treeRatio, setTreeRatio] = useState(() => readStoredModelOutlinerTreeSplitRatio());

  const propertiesRatio = 1 - treeRatio;

  return (
    <div
      ref={splitRef}
      className="grid min-h-0 flex-1 overflow-hidden"
      style={{
        gridTemplateRows: `minmax(72px, ${treeRatio}fr) 10px minmax(96px, ${propertiesRatio}fr)`,
        gridTemplateColumns: "1fr",
      }}
    >
      <div className="min-h-0 overflow-y-auto overscroll-contain px-2 pb-1 pt-1 scrollbar-hide">
        {tree}
      </div>

      <Splitter
        direction="vertical"
        containerRef={splitRef}
        onResize={(next) => {
          const clamped = clampTreeRatio(next);
          setTreeRatio(clamped);
          writeStoredModelOutlinerTreeSplitRatio(clamped);
        }}
      />

      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-t border-zinc-800/80">
        {properties}
      </div>
    </div>
  );
}
