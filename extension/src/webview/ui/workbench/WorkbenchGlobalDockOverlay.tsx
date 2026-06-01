import { memo } from 'react';
import type { WorkbenchGlobalDockZone } from './paneDock';
import { WORKBENCH_GLOBAL_DOCK_EDGE_PX } from './paneDock';
import { cn } from './cn';

const ZONE_LABEL: Record<WorkbenchGlobalDockZone, string> = {
  top: 'Dock to top',
  bottom: 'Dock to bottom',
  left: 'Dock to left',
  right: 'Dock to right',
};

/** Workbench-wide edge highlights while dragging a pane (Phase C2). */
export const WorkbenchGlobalDockOverlay = memo(function WorkbenchGlobalDockOverlay({
  visible,
  activeZone,
}: {
  visible: boolean;
  activeZone: WorkbenchGlobalDockZone | null;
}) {
  if (!visible) return null;

  const edge = WORKBENCH_GLOBAL_DOCK_EDGE_PX;
  const zoneClass = (zone: WorkbenchGlobalDockZone) =>
    cn(
      'absolute transition-colors',
      activeZone === zone
        ? 'bg-emerald-500/30 ring-1 ring-inset ring-emerald-400/70'
        : 'bg-emerald-500/8',
    );

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[255]"
      aria-hidden={!visible}
    >
      <div className={cn(zoneClass('top'), 'inset-x-0 top-0')} style={{ height: edge }} />
      <div className={cn(zoneClass('bottom'), 'inset-x-0 bottom-0')} style={{ height: edge }} />
      <div
        className={cn(zoneClass('left'), 'left-0')}
        style={{ top: edge, bottom: edge, width: edge }}
      />
      <div
        className={cn(zoneClass('right'), 'right-0')}
        style={{ top: edge, bottom: edge, width: edge }}
      />

      {activeZone ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rounded bg-black/75 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-200 shadow-lg">
            {ZONE_LABEL[activeZone]}
          </span>
        </div>
      ) : null}
    </div>
  );
});
