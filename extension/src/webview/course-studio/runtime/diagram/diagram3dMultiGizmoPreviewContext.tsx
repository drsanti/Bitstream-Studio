import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { Matrix4 } from "three";

type Diagram3dGizmoInteractionContextValue = {
  previewWorldMatricesRef: RefObject<Record<string, Matrix4> | null>;
  singleGizmoDragging: boolean;
  multiGizmoDragging: boolean;
  setSingleGizmoDragging: (dragging: boolean) => void;
  setMultiGizmoDragging: (dragging: boolean) => void;
  clearPreview: () => void;
};

const Diagram3dGizmoInteractionContext =
  createContext<Diagram3dGizmoInteractionContextValue | null>(null);

export function Diagram3dMultiGizmoPreviewProvider({ children }: { children: ReactNode }) {
  const previewWorldMatricesRef = useRef<Record<string, Matrix4> | null>(null);
  const [singleGizmoDragging, setSingleGizmoDraggingState] = useState(false);
  const [multiGizmoDragging, setMultiGizmoDraggingState] = useState(false);

  const setSingleGizmoDragging = useCallback((dragging: boolean) => {
    setSingleGizmoDraggingState(dragging);
  }, []);

  const setMultiGizmoDragging = useCallback((dragging: boolean) => {
    setMultiGizmoDraggingState(dragging);
  }, []);

  const clearPreview = useCallback(() => {
    previewWorldMatricesRef.current = null;
    setMultiGizmoDraggingState(false);
  }, []);

  useEffect(() => () => clearPreview(), [clearPreview]);

  const value = useMemo(
    () => ({
      previewWorldMatricesRef,
      singleGizmoDragging,
      multiGizmoDragging,
      setSingleGizmoDragging,
      setMultiGizmoDragging,
      clearPreview,
    }),
    [
      singleGizmoDragging,
      multiGizmoDragging,
      setSingleGizmoDragging,
      setMultiGizmoDragging,
      clearPreview,
    ],
  );

  return (
    <Diagram3dGizmoInteractionContext.Provider value={value}>
      {children}
    </Diagram3dGizmoInteractionContext.Provider>
  );
}

export function useDiagram3dGizmoInteraction(): Diagram3dGizmoInteractionContextValue | null {
  return useContext(Diagram3dGizmoInteractionContext);
}

export function useDiagram3dMultiGizmoPreviewRef(): RefObject<Record<string, Matrix4> | null> | null {
  return useContext(Diagram3dGizmoInteractionContext)?.previewWorldMatricesRef ?? null;
}

export function useClearDiagram3dMultiGizmoPreview(): () => void {
  const ctx = useContext(Diagram3dGizmoInteractionContext);
  return ctx?.clearPreview ?? (() => {});
}

/** Clears any live multi-gizmo preview when the viewport selection changes. */
export function Diagram3dMultiGizmoPreviewReset({ selectionKey }: { selectionKey: string }) {
  const clearPreview = useClearDiagram3dMultiGizmoPreview();
  const setSingleGizmoDragging = useContext(Diagram3dGizmoInteractionContext)?.setSingleGizmoDragging;
  useEffect(() => {
    clearPreview();
    setSingleGizmoDragging?.(false);
  }, [clearPreview, selectionKey, setSingleGizmoDragging]);
  return null;
}
