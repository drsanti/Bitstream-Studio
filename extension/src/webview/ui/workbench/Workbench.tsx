import { memo, useCallback, type ReactNode } from "react";
import type { LayoutNode, WorkbenchRegistry } from "./types";
import { Splitter } from "./Splitter";
import { PaneFrame } from "./PaneFrame";
import { updateNodeRatio, splitNode, closeNode, changeNodeType } from "./utils";
import "./workbench.css";

export interface WorkbenchProps {
  layout: LayoutNode;
  registry: WorkbenchRegistry;
  onLayoutChange: (newLayout: LayoutNode) => void;
}

export const Workbench = memo(({ layout, registry, onLayoutChange }: WorkbenchProps) => {
  const renderNode = useCallback(
    (node: LayoutNode): ReactNode => {
      if (node.type === "editor") {
        return (
          <PaneFrame
            key={node.id}
            node={node}
            registry={registry}
            onSplit={(dir) => onLayoutChange(splitNode(layout, node.id, dir))}
            onClose={() => onLayoutChange(closeNode(layout, node.id))}
            onChangeType={(type) => onLayoutChange(changeNodeType(layout, node.id, type))}
          />
        );
      }

      const isHorizontal = node.direction === "horizontal";

      return (
        <div
          key={node.id}
          className={`workbench-split-container ${node.direction}`}
          style={{
            display: "flex",
            flexDirection: isHorizontal ? "row" : "column",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            minHeight: 0,
            minWidth: 0,
          }}
        >
          <div
            style={{
              flex: node.ratio,
              overflow: "hidden",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              minWidth: 0,
            }}
          >
            {renderNode(node.first)}
          </div>

          <Splitter
            direction={node.direction}
            onResize={(newRatio) => onLayoutChange(updateNodeRatio(layout, node.id, newRatio))}
          />

          <div
            style={{
              flex: 1 - node.ratio,
              overflow: "hidden",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              minWidth: 0,
            }}
          >
            {renderNode(node.second)}
          </div>
        </div>
      );
    },
    [layout, registry, onLayoutChange],
  );

  return (
    <div className="ternion-workbench flex min-h-0 flex-1 flex-col" style={{ minHeight: 0 }}>
      {renderNode(layout)}
    </div>
  );
});

Workbench.displayName = "Workbench";
