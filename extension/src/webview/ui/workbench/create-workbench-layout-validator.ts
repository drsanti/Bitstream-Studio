import type { LayoutNode } from "./types";
import { validateLayoutTree } from "./layoutValidateCore";

export function createWorkbenchLayoutValidator(
  fallback: LayoutNode,
  knownEditorTypes: readonly string[],
  fallbackEditorType?: string,
): (raw: unknown) => LayoutNode {
  const known = new Set(knownEditorTypes);
  const fallbackType = fallbackEditorType ?? knownEditorTypes[0] ?? "main";
  return (raw: unknown) =>
    validateLayoutTree(raw, {
      fallback,
      knownEditorTypes: known,
      fallbackEditorType: fallbackType,
    });
}
