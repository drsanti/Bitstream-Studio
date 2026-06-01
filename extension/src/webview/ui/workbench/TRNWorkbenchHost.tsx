import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  memo,
  type ReactNode,
} from 'react';
import { TRNWorkbench, type TRNWorkbenchHandle, type TRNWorkbenchProps } from './TRNWorkbench';
import { FloatingWorkbenchLayer } from './FloatingWorkbenchLayer';
import {
  useWorkbenchFloating,
  type WorkbenchFloatingBindings,
} from './useWorkbenchFloating';

export interface TRNWorkbenchHostProps extends TRNWorkbenchProps {
  /**
   * When true (default), panes can detach to floating windows and dock back via drag.
   * Set false for a tiling-only shell.
   */
  enableFloating?: boolean;
  /** Portal target for float windows. Defaults to `document.body`. */
  portalTarget?: HTMLElement | null;
  /** Called when the user tries to float the last remaining pane. */
  onDetachRejected?: () => void;
  /** Optional chrome above the tiling area (workspace tabs, toolbars). */
  header?: ReactNode;
  className?: string;
  /** Parent-supplied floating layer (avoids duplicate state when composing managed workbench). */
  floatingBindings?: WorkbenchFloatingBindings;
}

/**
 * Batteries-included workbench: tiling tree + optional floating layer.
 * Copy `src/libs/TRNworkbench/` into another app and use this as the main entry.
 */
export const TRNWorkbenchHost = memo(
  forwardRef<TRNWorkbenchHandle, TRNWorkbenchHostProps>(function TRNWorkbenchHost(
    {
      enableFloating = true,
      portalTarget,
      onDetachRejected,
      header,
      className,
      floatingBindings,
      layout,
      onLayoutChange,
      activePaneId: activePaneIdProp,
      onPaneActivate: onPaneActivateProp,
      ...workbenchProps
    },
    ref,
  ) {
    const innerRef = useRef<TRNWorkbenchHandle>(null);
    useImperativeHandle(ref, () => innerRef.current!, []);

    const internalFloating = useWorkbenchFloating({
      layout,
      onLayoutChange,
      enabled: enableFloating && floatingBindings == null,
      onDetachRejected,
    });
    const floating = floatingBindings ?? internalFloating;

    const activePaneId = activePaneIdProp ?? floating.activePaneId;
    const onPaneActivate = useCallback(
      (id: string) => {
        if (activePaneIdProp == null) floating.setActivePaneId(id);
        onPaneActivateProp?.(id);
      },
      [activePaneIdProp, floating, onPaneActivateProp],
    );

    return (
      <div className={className ?? 'flex flex-1 flex-col min-h-0 min-w-0'}>
        {header}
        <div className="relative flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
          <TRNWorkbench
            ref={innerRef}
            layout={layout}
            onLayoutChange={onLayoutChange}
            activePaneId={activePaneId}
            onPaneActivate={onPaneActivate}
            {...workbenchProps}
            {...(enableFloating ? floating.workbenchProps : {})}
          />
        </div>
        {enableFloating ? (
          <FloatingWorkbenchLayer
            registry={workbenchProps.registry}
            portalTarget={portalTarget}
            {...floating.layerProps(innerRef)}
          />
        ) : null}
      </div>
    );
  }),
);

TRNWorkbenchHost.displayName = 'TRNWorkbenchHost';
