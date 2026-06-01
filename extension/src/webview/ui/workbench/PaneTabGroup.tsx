import { memo } from 'react';
import { GripVertical, X } from 'lucide-react';
import type { LayoutNode, WorkbenchRegistry } from './types';
import { PaneFrame } from './PaneFrame';
import type { PaneDockZone } from './paneDock';
import { cn } from './cn';
import { registryLabel } from './WorkbenchDockDragLayer';
import { WorkbenchHintButton } from './WorkbenchHintButton';

type TabsNode = Extract<LayoutNode, { type: 'tabs' }>;
type EditorNode = Extract<LayoutNode, { type: 'editor' }>;

export interface PaneTabGroupProps {
  node: TabsNode;
  registry: WorkbenchRegistry;
  activePaneId?: string | null;
  paneMaximized?: boolean;
  onSelectTab: (index: number) => void;
  onSplit: (paneId: string, direction: 'horizontal' | 'vertical') => void;
  onClose: (paneId: string) => void;
  onCollapse: (paneId: string) => void;
  onChangeType: (paneId: string, type: string) => void;
  onActivate?: (paneId: string) => void;
  onToggleMaximize?: (paneId: string) => void;
  dockDragSourceId?: string | null;
  dockHoverZone?: PaneDockZone | null;
  dockHoverTargetPaneId?: string | null;
  onDockZoneChange?: (targetPaneId: string, zone: PaneDockZone | null) => void;
  onDockDragStart?: (sourcePaneId: string) => void;
}

export const PaneTabGroup = memo(function PaneTabGroup({
  node,
  registry,
  activePaneId = null,
  paneMaximized = false,
  onSelectTab,
  onSplit,
  onClose,
  onCollapse,
  onChangeType,
  onActivate,
  onToggleMaximize,
  dockDragSourceId = null,
  dockHoverZone = null,
  dockHoverTargetPaneId = null,
  onDockZoneChange,
  onDockDragStart,
}: PaneTabGroupProps) {
  const activeIndex = Math.max(
    0,
    Math.min(node.activeIndex, Math.max(0, node.panes.length - 1)),
  );
  const activePane: EditorNode | undefined = node.panes[activeIndex];

  if (!activePane) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-tertiary">
        No panes in tab group
      </div>
    );
  }

  const hoverZone =
    dockHoverTargetPaneId === activePane.id ? dockHoverZone : null;
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="wb-pane-chrome-header flex h-8 shrink-0 items-stretch gap-0.5 border-0 px-1"
        role="tablist"
        aria-label="Docked pane tabs"
      >
        {node.panes.map((pane, index) => {
          const { label, icon } = registryLabel(registry, pane.editorType);
          const selected = index === activeIndex;
          const isDragSource = dockDragSourceId === pane.id;
          return (
            <div
              key={pane.id}
              className={cn(
                'group flex min-w-0 max-w-[13rem] items-center rounded-t border border-transparent',
                selected
                  ? 'border-zinc-700 border-b-bg-panel bg-bg-panel text-primary'
                  : 'text-tertiary hover:bg-white/5 hover:text-primary',
                isDragSource && 'bg-zinc-900/30',
              )}
            >
              <WorkbenchHintButton
                hint={`Drag ${label} — green studio edge or blue pane edge to dock`}
                ariaLabel={`Drag ${label} to another pane`}
                className="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded text-tertiary hover:bg-white/10 hover:text-primary active:cursor-grabbing"
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.stopPropagation();
                  onDockDragStart?.(pane.id);
                }}
              >
                <GripVertical size={10} aria-hidden />
              </WorkbenchHintButton>
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                className="flex min-w-0 flex-1 items-center gap-1.5 truncate px-1 py-1 text-[11px] font-medium"
                onClick={() => {
                  onSelectTab(index);
                  onActivate?.(pane.id);
                }}
              >
                <span className="shrink-0 opacity-80">{icon}</span>
                <span className="truncate">{label}</span>
              </button>
              {node.panes.length > 1 ? (
                <WorkbenchHintButton
                  hint={`Close ${label}`}
                  ariaLabel={`Close ${label}`}
                  className="mr-0.5 shrink-0 rounded p-0.5 text-tertiary opacity-0 transition-opacity hover:bg-white/10 hover:text-primary group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(pane.id);
                  }}
                >
                  <X size={12} aria-hidden />
                </WorkbenchHintButton>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <PaneFrame
          node={activePane}
          registry={registry}
          isActive={activePaneId === activePane.id}
          paneMaximized={paneMaximized}
          onSplit={(dir) => onSplit(activePane.id, dir)}
          onClose={() => onClose(activePane.id)}
          onCollapse={() => onCollapse(activePane.id)}
          onChangeType={(type) => onChangeType(activePane.id, type)}
          onActivate={() => onActivate?.(activePane.id)}
          onToggleMaximize={
            onToggleMaximize != null ? () => onToggleMaximize(activePane.id) : undefined
          }
          dockDragSourceId={dockDragSourceId}
          dockHoverZone={hoverZone}
          onDockZoneChange={onDockZoneChange}
          onDockDragStart={onDockDragStart}
        />
      </div>
    </div>
  );
});
