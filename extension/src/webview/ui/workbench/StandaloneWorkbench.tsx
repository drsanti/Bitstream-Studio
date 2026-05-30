import { forwardRef, memo, useEffect, useImperativeHandle, useState, type Dispatch, type SetStateAction } from "react";
import { Workbench } from "./Workbench";
import type { LayoutNode, WorkbenchRegistry } from "./types";

const STORAGE_PREFIX = "ternion_workbench_";

export interface StandaloneWorkbenchProps {
  initialLayout: LayoutNode;
  registry: WorkbenchRegistry;
  persistenceKey?: string;
}

export type StandaloneWorkbenchHandle = {
  resetLayout: () => void;
  setLayout: Dispatch<SetStateAction<LayoutNode>>;
  getLayout: () => LayoutNode;
};

export const StandaloneWorkbench = memo(
  forwardRef<StandaloneWorkbenchHandle, StandaloneWorkbenchProps>(function StandaloneWorkbench(
    { initialLayout, registry, persistenceKey },
    ref,
  ) {
    const [layout, setLayout] = useState<LayoutNode>(() => {
      if (persistenceKey != null && typeof window !== "undefined") {
        const saved = window.localStorage.getItem(`${STORAGE_PREFIX}${persistenceKey}`);
        if (saved != null) {
          try {
            return JSON.parse(saved) as LayoutNode;
          } catch {
            // fall through
          }
        }
      }
      return initialLayout;
    });

    useEffect(() => {
      if (persistenceKey == null || typeof window === "undefined") {
        return;
      }
      window.localStorage.setItem(`${STORAGE_PREFIX}${persistenceKey}`, JSON.stringify(layout));
    }, [layout, persistenceKey]);

    useImperativeHandle(
      ref,
      () => ({
        resetLayout: () => {
          if (persistenceKey != null && typeof window !== "undefined") {
            window.localStorage.removeItem(`${STORAGE_PREFIX}${persistenceKey}`);
          }
          setLayout(initialLayout);
        },
        setLayout,
        getLayout: () => layout,
      }),
      [initialLayout, layout, persistenceKey],
    );

    return <Workbench layout={layout} registry={registry} onLayoutChange={setLayout} />;
  }),
);

StandaloneWorkbench.displayName = "StandaloneWorkbench";
