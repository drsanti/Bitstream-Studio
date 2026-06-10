import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { DiagramV1 } from "../../schemas/diagram.v1";
import {
  listDiagram3dNodeIdsInViewportRect,
  type Scene3dViewportScreenRect,
} from "../scene/scene3dViewportBoxSelection";

export type Diagram3dBoxSelectProjector = (
  rect: Scene3dViewportScreenRect,
) => string[];

export function Diagram3dBoxSelectBridge({
  diagram,
  onRegisterProjector,
}: {
  diagram: DiagramV1;
  onRegisterProjector?: (projector: Diagram3dBoxSelectProjector | null) => void;
}) {
  const { camera, size } = useThree();

  useEffect(() => {
    if (onRegisterProjector == null) {
      return;
    }
    const projector: Diagram3dBoxSelectProjector = (rect) =>
      listDiagram3dNodeIdsInViewportRect(diagram, rect, camera, size.width, size.height);
    onRegisterProjector(projector);
    return () => {
      onRegisterProjector(null);
    };
  }, [camera, diagram, onRegisterProjector, size.height, size.width]);

  return null;
}
