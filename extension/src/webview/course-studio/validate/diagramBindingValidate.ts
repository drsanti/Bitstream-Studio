import { catalogEntryForPath } from "../runtime/diagram/diagramBindingCatalog";
import { collectDiagramBindingPaths } from "../runtime/diagram/collectDiagramBindings";
import type { DiagramV1 } from "../schemas/diagram.v1";

export function findUnknownDiagramBindingPaths(diagram: DiagramV1): string[] {
  const paths = collectDiagramBindingPaths(diagram);
  return paths.filter((path) => catalogEntryForPath(path) == null);
}
