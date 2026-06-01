import { useState, useEffect, memo, useRef } from 'react';
import type { LayoutNode, WorkbenchRegistry } from './types';
import { TRNWorkbenchHost } from './TRNWorkbenchHost';
import type { TRNWorkbenchHandle } from './TRNWorkbench';
import { loadPersistedLayout, savePersistedLayout } from './layoutPersistence';

/**
 * Props for the easy-to-use TRNManagedWorkbench.
 * Manages layout state, optional localStorage persistence, and optional floating panes.
 */
export interface TRNManagedWorkbenchProps {
  initialLayout: LayoutNode;
  registry: WorkbenchRegistry;
  persistenceKey?: string;
  enableFloating?: boolean;
  onDetachRejected?: () => void;
  portalTarget?: HTMLElement | null;
  className?: string;
  /** Validate loaded/saved JSON before applying (defaults to structural check only). */
  validateLayout?: (raw: unknown) => LayoutNode;
}

/**
 * Self-contained workbench with internal state — ideal for copy-paste into a new app.
 */
export const TRNManagedWorkbench = memo(function TRNManagedWorkbench({
  initialLayout,
  registry,
  persistenceKey,
  enableFloating = true,
  onDetachRejected,
  portalTarget,
  className,
  validateLayout,
}: TRNManagedWorkbenchProps) {
  const ref = useRef<TRNWorkbenchHandle>(null);
  const [layout, setLayout] = useState<LayoutNode>(() => {
    if (persistenceKey) {
      const saved = loadPersistedLayout(persistenceKey);
      if (saved) {
        return validateLayout ? validateLayout(saved) : saved;
      }
    }
    return initialLayout;
  });

  useEffect(() => {
    if (persistenceKey) savePersistedLayout(persistenceKey, layout);
  }, [layout, persistenceKey]);

  return (
    <TRNWorkbenchHost
      ref={ref}
      layout={layout}
      registry={registry}
      onLayoutChange={setLayout}
      enableFloating={enableFloating}
      onDetachRejected={onDetachRejected}
      portalTarget={portalTarget}
      className={className}
    />
  );
});

TRNManagedWorkbench.displayName = 'TRNManagedWorkbench';
