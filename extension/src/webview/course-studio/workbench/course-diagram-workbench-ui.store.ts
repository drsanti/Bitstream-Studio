import { create } from "zustand";

export type CourseDiagramEditorPlane = "draw" | "live";

type CourseDiagramWorkbenchUiState = {
  editorPlane: CourseDiagramEditorPlane;
  selectedKonvaShapeId: string | null;
  selectedKonvaShapeIds: string[];
  selectedKonvaShapeType: string | undefined;
  /** Bumped when inspector/outliner requests a new canvas selection. */
  konvaSelectionRequestNonce: number;
  setEditorPlane: (plane: CourseDiagramEditorPlane) => void;
  setKonvaSelection: (selection: {
    shapeId: string | null;
    shapeIds?: string[];
    shapeType?: string;
  }) => void;
  requestKonvaSelection: (shapeIds: string[], shapeType?: string) => void;
};

export const useCourseDiagramWorkbenchUiStore = create<CourseDiagramWorkbenchUiState>((set) => ({
  editorPlane: "draw",
  selectedKonvaShapeId: null,
  selectedKonvaShapeIds: [],
  selectedKonvaShapeType: undefined,
  konvaSelectionRequestNonce: 0,
  setEditorPlane: (plane) => set({ editorPlane: plane }),
  setKonvaSelection: (selection) =>
    set({
      selectedKonvaShapeId: selection.shapeId,
      selectedKonvaShapeIds:
        selection.shapeIds ?? (selection.shapeId != null ? [selection.shapeId] : []),
      selectedKonvaShapeType: selection.shapeType,
    }),
  requestKonvaSelection: (shapeIds, shapeType) =>
    set((state) => ({
      selectedKonvaShapeId: shapeIds[0] ?? null,
      selectedKonvaShapeIds: shapeIds,
      selectedKonvaShapeType: shapeType,
      konvaSelectionRequestNonce: state.konvaSelectionRequestNonce + 1,
    })),
}));
