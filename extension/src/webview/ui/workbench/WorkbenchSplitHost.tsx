import { memo, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import type { LayoutNode } from './types';
import { Splitter } from './Splitter';
import { isCollapsedEditor } from './utils';
import { directSplitChildEditorType } from './layoutTraversal';
import { updateNodeRatioAndSyncEditors } from './utils';

type SplitNode = Extract<LayoutNode, { type: 'split' }>;

/** Dedicated grid track for the gutter so pane content cannot cover the resize handle. */
const GUTTER_PX = 10;

function paneCellStyle(collapsed: boolean): CSSProperties {
  if (collapsed) {
    return {
      minWidth: 0,
      minHeight: 0,
      width: 'var(--workbench-rail-px, 32px)',
      maxWidth: 'var(--workbench-rail-px, 32px)',
      overflow: 'hidden',
    };
  }
  return { minWidth: 0, minHeight: 0, overflow: 'hidden' };
}

export const WorkbenchSplitHost = memo(function WorkbenchSplitHost({
  node,
  layout,
  onLayoutChange,
  onSplitResized,
  first,
  second,
}: {
  node: SplitNode;
  layout: LayoutNode;
  onLayoutChange: (next: LayoutNode) => void;
  onSplitResized?: (
    firstType: string,
    secondType: string,
    direction: 'horizontal' | 'vertical',
    ratio: number,
  ) => void;
  first: ReactNode;
  second: ReactNode;
}) {
  const splitRef = useRef<HTMLDivElement>(null);
  const isHorizontal = node.direction === 'horizontal';
  const firstCollapsed = isCollapsedEditor(node.first);
  const secondCollapsed = isCollapsedEditor(node.second);
  const ratio = Math.max(0.05, Math.min(0.95, node.ratio));

  const gridStyle = useMemo((): CSSProperties => {
    if (isHorizontal) {
      if (firstCollapsed && !secondCollapsed) {
        return {
          display: 'grid',
          gridTemplateColumns: `var(--workbench-rail-px, 32px) minmax(0, 1fr)`,
          gridTemplateRows: '1fr',
        };
      }
      if (secondCollapsed && !firstCollapsed) {
        return {
          display: 'grid',
          gridTemplateColumns: `minmax(0, 1fr) var(--workbench-rail-px, 32px)`,
          gridTemplateRows: '1fr',
        };
      }
      return {
        display: 'grid',
        gridTemplateColumns: `minmax(0, ${ratio}fr) ${GUTTER_PX}px minmax(0, ${1 - ratio}fr)`,
        gridTemplateRows: '1fr',
      };
    }

    if (firstCollapsed && !secondCollapsed) {
      return {
        display: 'grid',
        gridTemplateRows: `var(--workbench-rail-px, 32px) minmax(0, 1fr)`,
        gridTemplateColumns: '1fr',
      };
    }
    if (secondCollapsed && !firstCollapsed) {
      return {
        display: 'grid',
        gridTemplateRows: `minmax(0, 1fr) var(--workbench-rail-px, 32px)`,
        gridTemplateColumns: '1fr',
      };
    }
    return {
      display: 'grid',
      gridTemplateRows: `minmax(0, ${ratio}fr) ${GUTTER_PX}px minmax(0, ${1 - ratio}fr)`,
      gridTemplateColumns: '1fr',
    };
  }, [isHorizontal, ratio, firstCollapsed, secondCollapsed]);

  const showGutter = !firstCollapsed && !secondCollapsed;

  return (
    <div
      ref={splitRef}
      className="h-full min-h-0 w-full overflow-hidden"
      style={gridStyle}
    >
      <div className="relative flex min-h-0 min-w-0 flex-col" style={paneCellStyle(firstCollapsed)}>
        {first}
      </div>

      {showGutter ? (
        <Splitter
          direction={node.direction}
          containerRef={splitRef}
          onResize={(newRatio) => {
            onLayoutChange(updateNodeRatioAndSyncEditors(layout, node.id, newRatio));
            const firstType = directSplitChildEditorType(node.first);
            const secondType = directSplitChildEditorType(node.second);
            if (firstType && secondType) {
              onSplitResized?.(firstType, secondType, node.direction, newRatio);
            }
          }}
        />
      ) : null}

      <div className="relative flex min-h-0 min-w-0 flex-col" style={paneCellStyle(secondCollapsed)}>
        {second}
      </div>
    </div>
  );
});
