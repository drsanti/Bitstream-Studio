import { useLayoutEffect, useRef, useState } from 'react';
import {
  Columns2,
  Rows2,
  X,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  PanelLeftClose,
  GripVertical,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { LayoutNode, WorkbenchRegistry } from './types';
import type { PaneDockZone } from './paneDock';
import { PaneDockDropOverlay } from './PaneDockDropOverlay';
import { PaneEditorTypeMenu } from './PaneEditorTypeMenu';
import { WorkbenchHintButton } from './WorkbenchHintButton';
import { cn } from './cn';

interface PaneFrameProps {
  node: Extract<LayoutNode, { type: 'editor' }>;
  registry: WorkbenchRegistry;
  onSplit: (direction: 'horizontal' | 'vertical') => void;
  onClose: () => void;
  onCollapse: () => void;
  onChangeType: (type: string) => void;
  onActivate?: () => void;
  isActive?: boolean;
  paneMaximized?: boolean;
  onToggleMaximize?: () => void;
  dockDragSourceId?: string | null;
  dockHoverZone?: PaneDockZone | null;
  onDockZoneChange?: (targetPaneId: string, zone: PaneDockZone | null) => void;
  onDockDragStart?: (sourcePaneId: string) => void;
}

export function PaneFrame({
  node,
  registry,
  onSplit,
  onClose,
  onCollapse,
  onChangeType,
  onActivate,
  isActive = false,
  paneMaximized = false,
  onToggleMaximize,
  dockDragSourceId = null,
  dockHoverZone = null,
  onDockZoneChange,
  onDockDragStart,
}: PaneFrameProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [selectorAnchorEl, setSelectorAnchorEl] = useState<HTMLElement | null>(null);
  const selectorTriggerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    setSelectorAnchorEl(showSelector ? selectorTriggerRef.current : null);
  }, [showSelector]);
  const currentInfo = registry[node.editorType] || {
    icon: <HelpCircle size={14} />,
    label: 'Unknown',
    component: () => <div className="p-5 text-tertiary">Editor not found</div>,
  };

  const isDockDragging = dockDragSourceId != null;
  const isDragSource = dockDragSourceId === node.id;
  const showDropOverlay =
    isDockDragging && !isDragSource && dockDragSourceId !== node.id;

  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden min-h-0 bg-bg-panel">
      <div
        className={cn(
          'wb-pane-chrome-header relative z-20 flex h-8 shrink-0 items-center gap-0 overflow-visible border-0 pl-0 pr-2 select-none ring-0 outline-none',
          isDragSource && 'bg-zinc-900/30',
          isActive && !isDragSource && 'bg-zinc-900/40',
          paneMaximized && 'bg-zinc-900/50',
        )}
        onPointerDown={() => onActivate?.()}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          onToggleMaximize?.();
        }}
      >
        <WorkbenchHintButton
          hint="Drag — outside workbench to float; green ring = studio edge; blue = split or tabs"
          ariaLabel="Drag pane to dock"
          tooltipClassName="shrink-0 -ml-1"
          triggerClassName="!p-0"
          className="flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded text-tertiary hover:bg-white/10 hover:text-primary active:cursor-grabbing"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            onDockDragStart?.(node.id);
          }}
        >
          <GripVertical size={12} aria-hidden />
        </WorkbenchHintButton>

        <div
          ref={selectorTriggerRef}
          role="button"
          tabIndex={0}
          aria-expanded={showSelector}
          aria-haspopup="listbox"
          onClick={(e) => {
            e.stopPropagation();
            setShowSelector((open) => !open);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowSelector((open) => !open);
            }
          }}
          className={cn(
            'flex cursor-pointer items-center rounded px-2 py-0.5 transition-colors',
            showSelector ? 'bg-blue-600 text-white' : 'text-secondary hover:bg-white/10',
          )}
        >
          <div className="flex items-center justify-center min-w-[14px]">
            {currentInfo.icon}
          </div>
          <span className="ml-1.5 opacity-50">
            {showSelector ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </span>
        </div>

        <div className="min-w-0 shrink truncate text-[10px] font-bold text-tertiary uppercase tracking-widest">
          {currentInfo.label}
        </div>

        <div className="flex-1" />

        <div className="flex gap-0.5">
          {onToggleMaximize ? (
            <WorkbenchHintButton
              hint={
                paneMaximized
                  ? "Restore pane size (double-click header)"
                  : "Maximize pane in workbench (double-click header)"
              }
              ariaLabel={paneMaximized ? "Restore pane size" : "Maximize pane"}
              className="flex items-center justify-center w-6 h-6 rounded text-tertiary hover:bg-white/10 hover:text-blue-400 transition-all"
              onClick={onToggleMaximize}
            >
              {paneMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </WorkbenchHintButton>
          ) : null}
          <WorkbenchHintButton
            hint="Split side-by-side (new column)"
            ariaLabel="Split side-by-side"
            className="flex items-center justify-center w-6 h-6 rounded text-tertiary hover:bg-white/10 hover:text-blue-400 transition-all"
            onClick={() => onSplit("horizontal")}
          >
            <Columns2 size={13} />
          </WorkbenchHintButton>
          <WorkbenchHintButton
            hint="Split stacked (new row)"
            ariaLabel="Split stacked"
            className="flex items-center justify-center w-6 h-6 rounded text-tertiary hover:bg-white/10 hover:text-blue-400 transition-all"
            onClick={() => onSplit("vertical")}
          >
            <Rows2 size={13} />
          </WorkbenchHintButton>
          <WorkbenchHintButton
            hint="Collapse to edge strip (keeps slot — Ctrl+Shift+C)"
            ariaLabel="Collapse pane to edge strip"
            className="flex items-center justify-center w-6 h-6 rounded text-tertiary hover:bg-white/10 hover:text-primary transition-all"
            onClick={onCollapse}
          >
            <PanelLeftClose size={13} />
          </WorkbenchHintButton>
          <WorkbenchHintButton
            hint="Remove pane from layout"
            ariaLabel="Remove pane from layout"
            className="flex items-center justify-center w-6 h-6 rounded text-tertiary hover:bg-red-600/20 hover:text-red-500 transition-all ml-1"
            onClick={onClose}
          >
            <X size={14} />
          </WorkbenchHintButton>
        </div>

        <PaneEditorTypeMenu
          open={showSelector}
          anchorEl={selectorAnchorEl}
          currentEditorType={node.editorType}
          registry={registry}
          onSelect={onChangeType}
          onClose={() => setShowSelector(false)}
        />
      </div>

      <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden">
        {currentInfo.component && <currentInfo.component />}
        {showDropOverlay && onDockZoneChange ? (
          <PaneDockDropOverlay
            paneId={node.id}
            visible
            activeZone={dockHoverZone}
            onZoneChange={onDockZoneChange}
          />
        ) : null}
      </div>
    </div>
  );
}
