import { memo, useCallback, useMemo, useState } from 'react';
import { GripVertical, HelpCircle } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CollapseEdge, WorkbenchRegistry } from './types';
import {
  CollapsedRailContextMenu,
  type CollapsedRailMenuAnchor,
} from './CollapsedRailContextMenu';
import { WorkbenchHintButton } from './WorkbenchHintButton';
import { cn } from './cn';

export type CollapsedPaneEntry = {
  id: string;
  editorType: string;
  collapseEdge: CollapseEdge;
};

const RAIL_VERTICAL_CLASS =
  'flex w-[var(--workbench-rail-px,32px)] shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-white/8 bg-bg-header/60 py-1.5 select-none';

const RAIL_HORIZONTAL_CLASS =
  'flex h-[var(--workbench-rail-px,32px)] shrink-0 flex-row items-center gap-0.5 overflow-x-auto border-white/8 bg-bg-header/60 px-1.5 select-none';

function railBorderClass(edge: CollapseEdge): string {
  switch (edge) {
    case 'left':
      return 'border-r';
    case 'right':
      return 'border-l';
    case 'top':
      return 'border-b';
    case 'bottom':
      return 'border-t';
  }
}

function SortableCollapsedTab({
  entry,
  registry,
  onExpand,
  onContextMenu,
  vertical,
  focused,
  reorderable,
}: {
  entry: CollapsedPaneEntry;
  registry: WorkbenchRegistry;
  onExpand: (paneId: string) => void;
  onContextMenu: (paneId: string, label: string, clientX: number, clientY: number) => void;
  vertical: boolean;
  focused: boolean;
  reorderable: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id, disabled: !reorderable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const info = registry[entry.editorType] ?? {
    icon: <HelpCircle size={14} />,
    label: 'Unknown',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col items-center',
        isDragging && 'z-10 opacity-60',
      )}
    >
      <div
        className={cn(
          'flex items-center rounded transition-colors',
          vertical ? 'flex-col' : 'flex-row',
          focused ? 'bg-blue-600/25 ring-1 ring-blue-500/40' : 'hover:bg-white/10',
        )}
      >
        {reorderable ? (
          <button
            type="button"
            className={cn(
              'flex cursor-grab items-center justify-center text-tertiary active:cursor-grabbing',
              vertical ? 'h-4 w-7' : 'h-7 w-4',
            )}
            aria-label="Drag to reorder collapsed pane"
            {...attributes}
            {...listeners}
          >
            <GripVertical
              size={10}
              className={vertical ? 'rotate-0' : 'rotate-90'}
              aria-hidden
            />
          </button>
        ) : null}
        <WorkbenchHintButton
          hint={`Expand ${info.label} — right-click for menu`}
          ariaLabel={`Expand ${info.label}`}
          className={cn(
            'flex items-center justify-center rounded text-tertiary transition-colors hover:text-primary',
            vertical ? 'h-8 w-7 shrink-0' : 'h-7 min-w-8 shrink-0 px-1',
          )}
          onClick={() => onExpand(entry.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu(entry.id, info.label, e.clientX, e.clientY);
          }}
        >
          <span className="flex items-center justify-center">{info.icon}</span>
          <span
            className={cn(
              'max-w-[4.5rem] truncate text-[8px] font-bold uppercase tracking-wider',
              vertical ? 'sr-only' : 'ml-0.5',
            )}
          >
            {info.label}
          </span>
        </WorkbenchHintButton>
      </div>
    </div>
  );
}

/** One or more collapsed editors docked on the same edge (stacked tabs). */
export const CollapsedPaneRail = memo(function CollapsedPaneRail({
  panes,
  registry,
  onExpand,
  onClosePane,
  onBeginDockDrag,
  onReorder,
  stackSplitId,
  focusedPaneId,
}: {
  panes: CollapsedPaneEntry[];
  registry: WorkbenchRegistry;
  onExpand: (paneId: string) => void;
  onClosePane: (paneId: string) => void;
  onBeginDockDrag: (paneId: string) => void;
  /** When set with 2+ panes, drag-reorder updates split child order. */
  onReorder?: (splitId: string, orderedPaneIds: string[]) => void;
  stackSplitId?: string;
  focusedPaneId?: string | null;
}) {
  const [menuAnchor, setMenuAnchor] = useState<CollapsedRailMenuAnchor | null>(null);

  const openContextMenu = useCallback(
    (paneId: string, paneLabel: string, clientX: number, clientY: number) => {
      setMenuAnchor({ x: clientX, y: clientY, paneId, paneLabel });
    },
    [],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const edge = panes[0]?.collapseEdge ?? 'right';
  const vertical = edge === 'left' || edge === 'right';
  const reorderable = panes.length > 1 && Boolean(onReorder && stackSplitId);

  const paneIds = useMemo(() => panes.map((p) => p.id), [panes]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!reorderable || !stackSplitId || !onReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = paneIds.indexOf(String(active.id));
    const newIndex = paneIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(stackSplitId, arrayMove(paneIds, oldIndex, newIndex));
  };

  if (panes.length === 0) return null;

  const tabs = panes.map((entry, index) => (
    <div key={entry.id} className="flex flex-col items-center">
      {index > 0 ? (
        <div
          className={cn(
            'bg-white/10',
            vertical ? 'my-0.5 h-px w-5' : 'mx-0.5 h-5 w-px',
          )}
          aria-hidden
        />
      ) : null}
      <SortableCollapsedTab
        entry={entry}
        registry={registry}
        onExpand={onExpand}
        onContextMenu={openContextMenu}
        vertical={vertical}
        focused={focusedPaneId === entry.id}
        reorderable={reorderable}
      />
    </div>
  ));

  const body = (
    <div
      className={cn(
        vertical ? RAIL_VERTICAL_CLASS : RAIL_HORIZONTAL_CLASS,
        railBorderClass(edge),
      )}
      role="toolbar"
      aria-label="Collapsed panes"
    >
      {reorderable ? (
        <SortableContext
          items={paneIds}
          strategy={
            vertical ? verticalListSortingStrategy : horizontalListSortingStrategy
          }
        >
          {tabs}
        </SortableContext>
      ) : (
        tabs
      )}
    </div>
  );

  const shell = (
    <>
      {body}
      {menuAnchor ? (
        <CollapsedRailContextMenu
          anchor={menuAnchor}
          onClose={() => setMenuAnchor(null)}
          onExpand={onExpand}
          onClosePane={onClosePane}
          onBeginMove={onBeginDockDrag}
        />
      ) : null}
    </>
  );

  if (!reorderable) return shell;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {shell}
    </DndContext>
  );
});
