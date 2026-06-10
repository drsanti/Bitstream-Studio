import type { Diagram3dCameraV1 } from "../../schemas/diagram.v1";
import type { DiagramV1 } from "../../schemas/diagram.v1";
import { getDiagram3dLayer } from "../../schemas/normalizeDiagramV1";

export const DEFAULT_DIAGRAM_3D_CAMERA: Diagram3dCameraV1 = {
  position: [3, 2.5, 4],
  fov: 45,
};

export type ResolvedDiagram3dCamera = {
  position: [number, number, number];
  fov: number;
};

function finiteCameraAxis(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function readDiagram3dCamera(diagram: DiagramV1): ResolvedDiagram3dCamera {
  const layer = getDiagram3dLayer(diagram);
  const camera = layer?.camera;
  const defaultPosition = DEFAULT_DIAGRAM_3D_CAMERA.position ?? [3, 2.5, 4];
  const rawFov = camera?.fov ?? DEFAULT_DIAGRAM_3D_CAMERA.fov ?? 45;
  return {
    position: [
      finiteCameraAxis(camera?.position?.[0], defaultPosition[0]),
      finiteCameraAxis(camera?.position?.[1], defaultPosition[1]),
      finiteCameraAxis(camera?.position?.[2], defaultPosition[2]),
    ],
    fov: finiteCameraAxis(rawFov, 45),
  };
}
