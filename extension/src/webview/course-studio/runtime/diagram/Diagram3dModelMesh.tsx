import type { Diagram3dMaterialV1, Diagram3dModelIdV1 } from "../../schemas/diagram.v1";
import { resolveCourseDiagramCatalogGlbUrl } from "../../content/courseDiagramGlbCatalog";
import { isProceduralDiagram3dModelId } from "./diagram3dModelId";
import { Diagram3dCatalogModelMesh } from "./Diagram3dCatalogModelMesh";
import { Diagram3dProceduralModelMesh } from "./diagram3dProceduralModels";
import type { Scene3dNodeHighlightRole } from "./diagram3dSelectionAppearance";

export function Diagram3dModelMesh({
  modelId,
  opacity = 1,
  selected = false,
  active = false,
  highlightRole = "none",
  emissiveBoost,
  material,
  animationClip,
  animationLoop,
  animationPlaying,
}: {
  modelId: Diagram3dModelIdV1;
  opacity?: number;
  /** @deprecated Use highlightRole */
  selected?: boolean;
  /** @deprecated Use highlightRole */
  active?: boolean;
  highlightRole?: Scene3dNodeHighlightRole;
  emissiveBoost?: number;
  material?: Diagram3dMaterialV1;
  animationClip?: string;
  animationLoop?: boolean;
  animationPlaying?: boolean;
}) {
  const resolvedRole: Scene3dNodeHighlightRole =
    highlightRole !== "none"
      ? highlightRole
      : active
        ? "active"
        : selected
          ? "selected"
          : "none";
  const resolvedEmissive =
    emissiveBoost ??
    (resolvedRole === "active" ? 0.22 : resolvedRole === "selected" ? 0.16 : 0);

  if (isProceduralDiagram3dModelId(modelId)) {
    return (
      <Diagram3dProceduralModelMesh
        modelId={modelId}
        opacity={opacity}
        emissiveBoost={resolvedEmissive}
        material={material}
      />
    );
  }

  const url = resolveCourseDiagramCatalogGlbUrl(modelId);
  return (
    <Diagram3dCatalogModelMesh
      url={url}
      opacity={opacity}
      highlightRole={resolvedRole}
      emissiveBoost={resolvedEmissive}
      material={material}
      animationClip={animationClip}
      animationLoop={animationLoop}
      animationPlaying={animationPlaying}
    />
  );
}
