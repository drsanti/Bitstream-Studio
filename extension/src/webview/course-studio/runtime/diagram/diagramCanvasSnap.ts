export const DIAGRAM_SNAP_GRID = 4;

export function snapDiagramCoord(value: number, grid = DIAGRAM_SNAP_GRID): number {
  return Math.round(value / grid) * grid;
}
