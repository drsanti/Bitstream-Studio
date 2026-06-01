import { memo, type ReactNode } from 'react';
import type { WorkbenchRegistry } from './types';
import { cn } from './cn';

/** Floating label while dragging a pane by its title bar. */
export const WorkbenchDockDragLayer = memo(function WorkbenchDockDragLayer({
  label,
  icon,
  x,
  y,
}: {
  label: string;
  icon: ReactNode;
  x: number;
  y: number;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed z-[5000] flex items-center gap-2 rounded-md border border-blue-500/40',
        'bg-bg-header/95 px-2 py-1 shadow-lg shadow-black/40 backdrop-blur-md',
      )}
      style={{ left: x + 12, top: y + 12 }}
    >
      <span className="text-secondary">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
        {label}
      </span>
    </div>
  );
});

export function registryLabel(
  registry: WorkbenchRegistry,
  editorType: string,
): { label: string; icon: React.ReactNode } {
  const info = registry[editorType];
  return {
    label: info?.label ?? editorType,
    icon: info?.icon ?? null,
  };
}
