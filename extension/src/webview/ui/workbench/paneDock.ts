/** Drop target when docking a pane onto another by dragging the title bar. */
export type PaneDockZone = 'top' | 'bottom' | 'left' | 'right' | 'center';

export const PANE_DOCK_ZONE_HIT_PX = 56;

/** Outer workbench edge bands when dragging (Phase C2 global overlay). */
export const WORKBENCH_GLOBAL_DOCK_EDGE_PX = 72;

export type WorkbenchGlobalDockZone = Exclude<PaneDockZone, 'center'>;

export type PaneDockDragState = {
  sourcePaneId: string;
  editorType: string;
  /** Pane was detached (not in layout tree) when drag started. */
  fromFloat?: boolean;
};

export type PaneDockHoverState =
  | {
      kind: 'pane';
      targetPaneId: string;
      zone: PaneDockZone;
    }
  | {
      kind: 'global';
      zone: WorkbenchGlobalDockZone;
    };

/** True when pointer is in an outer workbench edge band (global dock target). */
export function workbenchGlobalZoneAtPoint(
  container: HTMLElement,
  clientX: number,
  clientY: number,
): WorkbenchGlobalDockZone | null {
  const rect = container.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const w = rect.width;
  const h = rect.height;
  const edge = WORKBENCH_GLOBAL_DOCK_EDGE_PX;

  if (x < edge) return 'left';
  if (x > w - edge) return 'right';
  if (y < edge) return 'top';
  if (y > h - edge) return 'bottom';
  return null;
}
