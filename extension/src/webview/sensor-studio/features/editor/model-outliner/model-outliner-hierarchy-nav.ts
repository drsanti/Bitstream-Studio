import type {
  StudioGltfExtractRow,
  StudioGltfExtractionResult,
  StudioGltfSceneTreeNode,
} from "../gltf/studio-gltf-extract";
import type { ModelOutlinerTypeFilter } from "./model-outliner-type-filter";

export type ModelOutlinerFlatTreeRow = {
  path: string;
  node: StudioGltfSceneTreeNode;
  extractRow: StudioGltfExtractRow | null;
  hasChildren: boolean;
  expanded: boolean;
  depth: number;
};

function lookupExtractRow(
  node: StudioGltfSceneTreeNode,
  extraction: StudioGltfExtractionResult,
): StudioGltfExtractRow | null {
  const { path, label, nodeType } = node;
  if (nodeType === "light") {
    return extraction.lights.find((r) => r.ref === label || r.ref === path) ?? null;
  }
  if (nodeType === "camera") {
    return extraction.cameras.find((r) => r.ref === label || r.ref === path) ?? null;
  }
  if (nodeType === "mesh" || nodeType === "bone" || nodeType === "group") {
    return extraction.parts.find((r) => r.ref === path) ?? null;
  }
  return null;
}

function nodeMatchesSearch(node: StudioGltfSceneTreeNode, q: string): boolean {
  if (q.length === 0) {
    return true;
  }
  const hay = `${node.label} ${node.path} ${node.nodeType}`.toLowerCase();
  if (hay.includes(q)) {
    return true;
  }
  return node.children.some((child) => nodeMatchesSearch(child, q));
}

function nodeMatchesTypeFilter(
  node: StudioGltfSceneTreeNode,
  filter: ModelOutlinerTypeFilter,
  extraction: StudioGltfExtractionResult,
): boolean {
  if (filter === "all") {
    return true;
  }
  const row = lookupExtractRow(node, extraction);
  if (row?.kind === filter) {
    return true;
  }
  return node.children.some((child) => nodeMatchesTypeFilter(child, filter, extraction));
}

function nodeIsVisible(
  node: StudioGltfSceneTreeNode,
  searchQuery: string,
  typeFilter: ModelOutlinerTypeFilter,
  extraction: StudioGltfExtractionResult,
): boolean {
  const q = searchQuery.trim().toLowerCase();
  const matchesSearch = q.length === 0 || nodeMatchesSearch(node, q);
  const matchesType = nodeMatchesTypeFilter(node, typeFilter, extraction);
  return matchesSearch && matchesType;
}

export function buildDefaultExpandedPaths(
  roots: readonly StudioGltfSceneTreeNode[],
  maxDepth: number,
): Set<string> {
  const paths = new Set<string>();
  const walk = (node: StudioGltfSceneTreeNode, depth: number) => {
    if (node.children.length === 0) {
      return;
    }
    if (depth < maxDepth) {
      paths.add(node.path);
    }
    for (const child of node.children) {
      walk(child, depth + 1);
    }
  };
  for (const root of roots) {
    walk(root, 0);
  }
  return paths;
}

export function flattenVisibleHierarchy(
  roots: readonly StudioGltfSceneTreeNode[],
  expandedPaths: ReadonlySet<string>,
  searchQuery: string,
  typeFilter: ModelOutlinerTypeFilter,
  extraction: StudioGltfExtractionResult,
): ModelOutlinerFlatTreeRow[] {
  const rows: ModelOutlinerFlatTreeRow[] = [];
  const q = searchQuery.trim().toLowerCase();
  const forceExpand = q.length > 0;

  const walk = (node: StudioGltfSceneTreeNode, depth: number) => {
    if (!nodeIsVisible(node, searchQuery, typeFilter, extraction)) {
      return;
    }
    const hasChildren = node.children.length > 0;
    const expanded = forceExpand || expandedPaths.has(node.path);
    rows.push({
      path: node.path,
      node,
      extractRow: lookupExtractRow(node, extraction),
      hasChildren,
      expanded,
      depth,
    });
    if (hasChildren && expanded) {
      for (const child of node.children) {
        walk(child, depth + 1);
      }
    }
  };

  for (const root of roots) {
    walk(root, 0);
  }
  return rows;
}

export function parentScenePath(path: string): string | null {
  const trimmed = path.trim();
  const slash = trimmed.lastIndexOf("/");
  if (slash <= 0) {
    return null;
  }
  return trimmed.slice(0, slash);
}

export function collectAllExpandablePaths(
  roots: readonly StudioGltfSceneTreeNode[],
): Set<string> {
  const paths = new Set<string>();
  const walk = (node: StudioGltfSceneTreeNode) => {
    if (node.children.length === 0) {
      return;
    }
    paths.add(node.path);
    for (const child of node.children) {
      walk(child);
    }
  };
  for (const root of roots) {
    walk(root);
  }
  return paths;
}
