import { DIAGRAM_3D_PROCEDURAL_MODEL_IDS } from "../runtime/diagram/diagram3dModelId";
import {
  DIAGRAM_3D_MATERIAL_TEXTURE_URL_FIELDS,
  sanitizeDiagram3dTextureUrl,
} from "../runtime/diagram/diagram3dTextureMaps";
import type { Diagram3dModelNodeV1, Diagram3dNodeV1 } from "../schemas/diagram.v1";
import { getDiagram3dLayer } from "../schemas/normalizeDiagramV1";
import type { SceneV1 } from "../schemas/scene.v1";
import { sceneV1ToDiagramV1 } from "../runtime/scene/sceneDiagramBridge";
import { isCatalogDiagram3dModelId } from "../runtime/diagram/diagram3dModelId";
import type { CourseValidateIssue } from "./courseContentValidate";

const PROCEDURAL_SET = new Set<string>(DIAGRAM_3D_PROCEDURAL_MODEL_IDS);

function issue(
  severity: "error" | "warn",
  code: string,
  message: string,
  file: string,
): CourseValidateIssue {
  return { severity, code, message, file };
}

function walkModelNodes(nodes: Diagram3dNodeV1[], visit: (node: Diagram3dModelNodeV1) => void): void {
  for (const node of nodes) {
    if (node.type === "model") {
      visit(node);
    } else {
      walkModelNodes(node.children, visit);
    }
  }
}

function validateModelNode(node: Diagram3dModelNodeV1, relFile: string): CourseValidateIssue[] {
  const issues: CourseValidateIssue[] = [];
  const modelId = node.modelId;
  if (!isCatalogDiagram3dModelId(modelId) && !PROCEDURAL_SET.has(modelId)) {
    issues.push(
      issue(
        "error",
        "unknown-model-id",
        `Scene node "${node.id}" uses unknown modelId "${modelId}".`,
        relFile,
      ),
    );
  }

  const material = node.material;
  if (material == null) {
    return issues;
  }

  if (material.materialTarget === "byName" && (material.materialName?.trim().length ?? 0) === 0) {
    issues.push(
      issue(
        "error",
        "material-target-name-missing",
        `Scene node "${node.id}" materialTarget is byName but materialName is empty.`,
        relFile,
      ),
    );
  }

  for (const field of DIAGRAM_3D_MATERIAL_TEXTURE_URL_FIELDS) {
    const raw = material[field];
    if (typeof raw === "string" && raw.trim().length > 0 && sanitizeDiagram3dTextureUrl(raw) == null) {
      issues.push(
        issue(
          "warn",
          "invalid-texture-url",
          `Scene node "${node.id}" has invalid texture URL on ${field}: "${raw}".`,
          relFile,
        ),
      );
    }
  }

  return issues;
}

export function validateSceneDocumentContent(scene: SceneV1, relFile: string): CourseValidateIssue[] {
  const layer = getDiagram3dLayer(sceneV1ToDiagramV1(scene));
  if (layer == null) {
    return [];
  }

  const issues: CourseValidateIssue[] = [];
  walkModelNodes(layer.nodes, (node) => {
    issues.push(...validateModelNode(node, relFile));
  });
  return issues;
}

export function findOrphanSceneDocuments(
  sceneIds: Iterable<string>,
  referencedIds: Iterable<string>,
  contentDir: string,
): CourseValidateIssue[] {
  const referenced = new Set(referencedIds);
  const issues: CourseValidateIssue[] = [];
  for (const sceneId of sceneIds) {
    if (!referenced.has(sceneId)) {
      issues.push(
        issue(
          "warn",
          "orphan-scene",
          `Scene "${sceneId}" is not referenced by any page block.`,
          contentDir,
        ),
      );
    }
  }
  return issues;
}
