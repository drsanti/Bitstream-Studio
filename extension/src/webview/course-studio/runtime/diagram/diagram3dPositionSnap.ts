/** Round diagram 3D position components for stable JSON after gizmo drags. */
export function roundDiagram3dPositionComponent(value: number, precision = 3): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function roundDiagram3dPosition(
  position: [number, number, number],
  precision = 3,
): [number, number, number] {
  return [
    roundDiagram3dPositionComponent(position[0], precision),
    roundDiagram3dPositionComponent(position[1], precision),
    roundDiagram3dPositionComponent(position[2], precision),
  ];
}
