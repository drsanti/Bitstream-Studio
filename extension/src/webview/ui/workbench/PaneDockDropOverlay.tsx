import { memo, useCallback, useRef } from 'react';
import type { PaneDockZone } from './paneDock';
import { PANE_DOCK_ZONE_HIT_PX } from './paneDock';
import { cn } from './cn';

function zoneFromPointer(
  el: HTMLElement,
  clientX: number,
  clientY: number,
): PaneDockZone {
  const rect = el.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const w = rect.width;
  const h = rect.height;
  const edge = PANE_DOCK_ZONE_HIT_PX;

  const inCenterX = x > edge && x < w - edge;
  const inCenterY = y > edge && y < h - edge;
  if (inCenterX && inCenterY) return 'center';

  const topDist = y;
  const bottomDist = h - y;
  const leftDist = x;
  const rightDist = w - x;
  const min = Math.min(topDist, bottomDist, leftDist, rightDist);

  if (min === topDist) return 'top';
  if (min === bottomDist) return 'bottom';
  if (min === leftDist) return 'left';
  return 'right';
}

const ZONE_LABEL: Record<PaneDockZone, string> = {
  top: 'Dock top',
  bottom: 'Dock bottom',
  left: 'Dock left',
  right: 'Dock right',
  center: 'Add tab',
};

export const PaneDockDropOverlay = memo(function PaneDockDropOverlay({
  paneId,
  visible,
  activeZone,
  onZoneChange,
}: {
  paneId: string;
  visible: boolean;
  activeZone: PaneDockZone | null;
  onZoneChange: (targetPaneId: string, zone: PaneDockZone | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  const updateZone = useCallback(
    (clientX: number, clientY: number) => {
      const el = rootRef.current;
      if (!el) return;
      onZoneChange(paneId, zoneFromPointer(el, clientX, clientY));
    },
    [onZoneChange, paneId],
  );

  if (!visible) return null;

  const edge = PANE_DOCK_ZONE_HIT_PX;
  const zoneClass = (zone: PaneDockZone) =>
    cn(
      'pointer-events-auto absolute z-[200] transition-colors',
      activeZone === zone
        ? 'bg-blue-500/35 ring-1 ring-inset ring-blue-400/60'
        : 'bg-blue-500/10 hover:bg-blue-500/20',
      zone === 'center' && 'rounded-md',
    );

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-[150]"
      aria-hidden={!visible}
      onPointerMove={(e) => updateZone(e.clientX, e.clientY)}
      onPointerLeave={() => onZoneChange(paneId, null)}
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
      <div
        className={cn(zoneClass('center'), 'inset-0')}
        style={{
          top: edge,
          bottom: edge,
          left: edge,
          right: edge,
        }}
      />
      {activeZone ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded bg-black/70 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-blue-200">
            {ZONE_LABEL[activeZone]}
          </span>
        </div>
      ) : null}
    </div>
  );
});
