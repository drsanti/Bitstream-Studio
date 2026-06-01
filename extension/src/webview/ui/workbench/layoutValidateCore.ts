import type { LayoutNode } from './types';

export interface ValidateLayoutTreeOptions {
  /** Used when `raw` is missing or structurally invalid. */
  fallback: LayoutNode;
  /** If set, unknown editor types are replaced with `fallbackEditorType`. */
  knownEditorTypes?: ReadonlySet<string>;
  fallbackEditorType?: string;
  /** Remap legacy editor type strings (e.g. renamed panes in a product upgrade). */
  migrateEditorType?: (editorType: string) => string;
  /** Final pass after structural + type migration (product-specific layout rules). */
  postMigrate?: (layout: LayoutNode) => LayoutNode;
}

function isLayoutNodeShape(value: unknown): value is LayoutNode {
  if (!value || typeof value !== 'object') return false;
  const node = value as LayoutNode;
  if (node.type === 'editor') return typeof node.id === 'string' && typeof node.editorType === 'string';
  if (node.type === 'tabs') {
    return (
      typeof node.id === 'string' &&
      Array.isArray(node.panes) &&
      node.panes.length > 0 &&
      typeof node.activeIndex === 'number'
    );
  }
  if (node.type === 'split') {
    return (
      typeof node.id === 'string' &&
      (node.direction === 'horizontal' || node.direction === 'vertical') &&
      typeof node.ratio === 'number' &&
      node.first != null &&
      node.second != null
    );
  }
  return false;
}

function migrateEditorTypesInTree(
  node: LayoutNode,
  options: ValidateLayoutTreeOptions,
): LayoutNode {
  const { knownEditorTypes, fallbackEditorType = 'main', migrateEditorType } = options;

  if (node.type === 'editor') {
    let editorType = migrateEditorType ? migrateEditorType(node.editorType) : node.editorType;
    if (knownEditorTypes && !knownEditorTypes.has(editorType)) {
      editorType = knownEditorTypes.has(node.editorType)
        ? node.editorType
        : fallbackEditorType;
    }
    return { ...node, editorType };
  }
  if (node.type === 'tabs') {
    const panes = node.panes.map(
      (p) => migrateEditorTypesInTree(p, options) as Extract<LayoutNode, { type: 'editor' }>,
    );
    const activeIndex = Math.max(0, Math.min(node.activeIndex, panes.length - 1));
    return { ...node, panes, activeIndex };
  }
  return {
    ...node,
    first: migrateEditorTypesInTree(node.first, options),
    second: migrateEditorTypesInTree(node.second, options),
  };
}

/**
 * Parse and normalize a persisted layout tree.
 * Host apps supply fallbacks and optional editor-type migration.
 */
export function validateLayoutTree(
  raw: unknown,
  options: ValidateLayoutTreeOptions,
): LayoutNode {
  const fallback = structuredClone(options.fallback);
  if (!isLayoutNodeShape(raw)) return fallback;

  let layout = migrateEditorTypesInTree(raw, options);
  if (options.postMigrate) layout = options.postMigrate(layout);
  return layout;
}
