import { createContext, useContext, type ReactNode } from "react";

const StudioFlowCanvasDisplayScaleContext = createContext(1);

export type StudioFlowCanvasDisplayScaleProviderProps = {
  /** React Flow viewport zoom (`transform[2]`). */
  value: number;
  children: ReactNode;
};

/** Supplies flow viewport zoom to canvas/WebGL panels rendered inside {@link StudioNodeCard}. */
export function StudioFlowCanvasDisplayScaleProvider(
  props: StudioFlowCanvasDisplayScaleProviderProps,
) {
  const scale =
    Number.isFinite(props.value) && props.value > 0 ? props.value : 1;
  return (
    <StudioFlowCanvasDisplayScaleContext.Provider value={scale}>
      {props.children}
    </StudioFlowCanvasDisplayScaleContext.Provider>
  );
}

/**
 * Effective display scale for hi-DPI canvas/WebGL inside flow nodes.
 * Uses context from the flow card when present; falls back to `override` or 1 (inspector).
 */
export function useStudioCanvasDisplayScale(override?: number): number {
  const fromFlow = useContext(StudioFlowCanvasDisplayScaleContext);
  if (override != null && Number.isFinite(override) && override > 0) {
    return override;
  }
  return fromFlow;
}
