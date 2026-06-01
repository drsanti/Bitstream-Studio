import type { EditorType } from './types';

/** A pane detached from the tiling tree into a floating window. */
export interface FloatingWorkbenchPane {
  id: string;
  editorType: EditorType;
  x: number;
  y: number;
  width: number;
  height: number;
}
