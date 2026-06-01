import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { WorkbenchRegistry } from './types';
import { cn } from './cn';

export const PaneEditorTypeMenu = memo(function PaneEditorTypeMenu({
  open,
  anchorEl,
  currentEditorType,
  registry,
  onSelect,
  onClose,
}: {
  open: boolean;
  anchorEl: HTMLElement | null;
  currentEditorType: string;
  registry: WorkbenchRegistry;
  onSelect: (editorType: string) => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const entries = useMemo(
    () =>
      Object.entries(registry).sort(([, a], [, b]) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
      ),
    [registry],
  );

  useLayoutEffect(() => {
    if (!open || !anchorEl) {
      setMenuPosition(null);
      return;
    }
    const update = () => {
      const rect = anchorEl.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 280;
      const gap = 4;
      const fitsBelow = rect.bottom + gap + menuHeight <= window.innerHeight - 8;
      setMenuPosition({
        top: fitsBelow ? rect.bottom + gap : Math.max(8, rect.top - gap - menuHeight),
        left: Math.min(rect.left, window.innerWidth - 200),
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorEl, open, entries.length]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [anchorEl, onClose, open]);

  if (!open || !portalTarget || !anchorEl || !menuPosition) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="listbox"
      aria-label="Change pane type"
      className="pointer-events-auto fixed z-[1100] w-48 max-h-[min(60vh,20rem)] overflow-y-auto rounded-lg border border-white/10 bg-bg-header/95 p-1 shadow-2xl shadow-black/50 backdrop-blur-2xl"
      style={{ top: menuPosition.top, left: menuPosition.left }}
      onClick={(e) => e.stopPropagation()}
    >
      {entries.map(([key, info]) => (
        <button
          key={key}
          type="button"
          role="option"
          aria-selected={currentEditorType === key}
          onClick={() => {
            onSelect(key);
            onClose();
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-xs transition-colors',
            currentEditorType === key
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-primary hover:bg-white/10 hover:text-primary',
          )}
        >
          <span className="text-sm">{info.icon}</span>
          <span className="font-medium">{info.label}</span>
        </button>
      ))}
    </div>,
    portalTarget,
  );
});
