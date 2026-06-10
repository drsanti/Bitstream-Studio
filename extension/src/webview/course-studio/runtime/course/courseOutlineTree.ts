import type { CourseNodeKindV1, CourseNodeV1, CourseV1 } from "../../schemas/course.v1";

export type CourseOutlineBreadcrumb = {
  id: string;
  kind: CourseNodeKindV1;
  title: string;
};

export type CourseNodeLocation = {
  node: CourseNodeV1;
  parent: CourseNodeV1 | null;
  index: number;
  path: CourseOutlineBreadcrumb[];
};

function cloneNode(node: CourseNodeV1): CourseNodeV1 {
  return {
    ...node,
    children: node.children?.map(cloneNode),
  };
}

export function cloneCourse(course: CourseV1): CourseV1 {
  return {
    ...course,
    root: cloneNode(course.root),
  };
}

/** Append outline nodes from bundled course that are missing in the session draft (by node id). */
function mergeChildNodes(
  draftChildren: CourseNodeV1[],
  bundledChildren: CourseNodeV1[],
): CourseNodeV1[] {
  const draftById = new Map(draftChildren.map((child) => [child.id, cloneNode(child)]));
  const order = draftChildren.map((child) => child.id);
  const appended: CourseNodeV1[] = [];

  for (const bundledChild of bundledChildren) {
    const existing = draftById.get(bundledChild.id);
    if (existing == null) {
      appended.push(cloneNode(bundledChild));
      continue;
    }
    if ((bundledChild.children?.length ?? 0) > 0) {
      existing.children = mergeChildNodes(
        existing.children ?? [],
        bundledChild.children ?? [],
      );
    }
  }

  return [...order.map((id) => draftById.get(id)!), ...appended];
}

export function mergeCourseOutlineWithBundled(draft: CourseV1, bundled: CourseV1): CourseV1 {
  const merged = cloneCourse(draft);
  merged.root = {
    ...merged.root,
    children: mergeChildNodes(merged.root.children ?? [], bundled.root.children ?? []),
  };
  return merged;
}

export function courseBreadcrumbForNode(
  root: CourseNodeV1 | null | undefined,
  activeNodeId: string | null,
): CourseOutlineBreadcrumb[] {
  if (root == null || activeNodeId == null) {
    return [];
  }
  const location = findCourseNode(root, activeNodeId);
  return location?.path ?? [];
}

export function findCourseNode(
  root: CourseNodeV1,
  nodeId: string,
  parent: CourseNodeV1 | null = null,
  path: CourseOutlineBreadcrumb[] = [],
): CourseNodeLocation | null {
  const currentPath = [...path, { id: root.id, kind: root.kind, title: root.title }];
  if (root.id === nodeId) {
    return { node: root, parent, index: -1, path: currentPath };
  }
  const children = root.children ?? [];
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index]!;
    const found = findCourseNode(child, nodeId, root, currentPath);
    if (found != null) {
      return { ...found, index };
    }
  }
  return null;
}

export function walkCourseNodes(
  root: CourseNodeV1,
  visit: (node: CourseNodeV1, path: CourseOutlineBreadcrumb[]) => void,
  path: CourseOutlineBreadcrumb[] = [],
): void {
  const currentPath = [...path, { id: root.id, kind: root.kind, title: root.title }];
  visit(root, currentPath);
  for (const child of root.children ?? []) {
    walkCourseNodes(child, visit, currentPath);
  }
}

export function collectCoursePageIds(root: CourseNodeV1): string[] {
  const ids = new Set<string>();
  walkCourseNodes(root, (node) => {
    if (node.pageId != null && node.pageId.length > 0) {
      ids.add(node.pageId);
    }
  });
  return [...ids];
}

export function findCourseNodeIdForPageId(root: CourseNodeV1, pageId: string): string | null {
  let match: string | null = null;
  walkCourseNodes(root, (node) => {
    if (match != null) {
      return;
    }
    if (node.pageId === pageId) {
      match = node.id;
    }
  });
  return match;
}

export function findFirstNavigableNodeId(root: CourseNodeV1): string | null {
  let first: string | null = null;
  walkCourseNodes(root, (node) => {
    if (first != null) {
      return;
    }
    if (node.pageId != null && node.pageId.length > 0) {
      first = node.id;
    }
  });
  return first;
}

export function pageIdForCourseNode(root: CourseNodeV1, nodeId: string): string | null {
  const location = findCourseNode(root, nodeId);
  return location?.node.pageId ?? null;
}

export function allowedChildKindForNode(node: CourseNodeV1): CourseNodeKindV1 | null {
  switch (node.kind) {
    case "book":
      return "chapter";
    case "chapter":
      return "topic";
    case "topic":
      return "subtopic";
    default:
      return null;
  }
}

export function canAddChildToNode(node: CourseNodeV1, childKind: CourseNodeKindV1): boolean {
  const allowed = allowedChildKindForNode(node);
  if (allowed == null) {
    return false;
  }
  if (childKind === allowed) {
    return true;
  }
  if (node.kind === "chapter" && childKind === "subtopic") {
    return true;
  }
  return false;
}

export function slugifyCourseTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug.slice(0, 48) : "untitled";
}

export function nextCourseNodeId(prefix: string, course: CourseV1): string {
  const existing = new Set<string>();
  walkCourseNodes(course.root, (node) => {
    existing.add(node.id);
  });
  let index = 1;
  while (existing.has(`${prefix}-${index}`)) {
    index += 1;
  }
  return `${prefix}-${index}`;
}

export function nextCoursePageId(title: string, course: CourseV1): string {
  const slug = slugifyCourseTitle(title);
  const existing = new Set(collectCoursePageIds(course.root));
  let candidate = slug;
  let index = 2;
  while (existing.has(candidate)) {
    candidate = `${slug}-${index}`;
    index += 1;
  }
  return candidate;
}

function defaultTitleForKind(kind: CourseNodeKindV1): string {
  switch (kind) {
    case "chapter":
      return "New chapter";
    case "topic":
      return "New topic";
    case "subtopic":
      return "New subtopic";
    default:
      return "New section";
  }
}

export type InsertCourseNodeResult = {
  course: CourseV1;
  nodeId: string;
  pageId: string | null;
};

export function insertCourseChildNode(
  course: CourseV1,
  parentId: string,
  kind: CourseNodeKindV1,
  options?: { title?: string; pageId?: string | null },
): InsertCourseNodeResult {
  const draft = cloneCourse(course);
  const parentLocation = findCourseNode(draft.root, parentId);
  if (parentLocation == null) {
    throw new Error(`Parent node "${parentId}" not found`);
  }
  const parent = parentLocation.node;
  if (!canAddChildToNode(parent, kind)) {
    throw new Error(`Cannot add ${kind} under ${parent.kind}`);
  }

  const title = options?.title?.trim() || defaultTitleForKind(kind);
  const nodeId = nextCourseNodeId(kind, draft);
  const needsPage = kind === "topic" || kind === "subtopic";
  const pageId =
    needsPage && options?.pageId !== null
      ? (options?.pageId ?? nextCoursePageId(title, draft))
      : undefined;

  const child: CourseNodeV1 = {
    id: nodeId,
    kind,
    title,
    ...(pageId != null ? { pageId } : {}),
    ...(kind === "chapter" || kind === "book" ? { children: [] } : {}),
  };

  if (kind === "topic" && parent.kind === "chapter") {
    child.children = [];
  }

  if (kind === "subtopic" && parent.kind === "topic" && parent.pageId != null) {
    delete parent.pageId;
  }

  parent.children = [...(parent.children ?? []), child];

  return { course: draft, nodeId, pageId: pageId ?? null };
}

export function renameCourseNode(course: CourseV1, nodeId: string, title: string): CourseV1 {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return course;
  }
  const draft = cloneCourse(course);
  const location = findCourseNode(draft.root, nodeId);
  if (location == null) {
    throw new Error(`Node "${nodeId}" not found`);
  }
  location.node.title = trimmed;
  return draft;
}

export function removeCourseNode(course: CourseV1, nodeId: string): CourseV1 {
  if (course.root.id === nodeId) {
    throw new Error("Cannot delete the book root");
  }
  const draft = cloneCourse(course);
  const location = findCourseNode(draft.root, nodeId);
  if (location?.parent == null) {
    throw new Error(`Node "${nodeId}" not found`);
  }
  const siblings = location.parent.children ?? [];
  location.parent.children = siblings.filter((child) => child.id !== nodeId);
  return draft;
}

/** Reorder a node among its siblings (same parent). No-op when ids match or parent missing. */
export function reorderCourseSiblings(
  course: CourseV1,
  parentId: string,
  activeNodeId: string,
  overNodeId: string,
): CourseV1 {
  if (activeNodeId === overNodeId) {
    return course;
  }
  const draft = cloneCourse(course);
  const parentLocation = findCourseNode(draft.root, parentId);
  if (parentLocation?.node == null) {
    throw new Error(`Parent node "${parentId}" not found`);
  }
  const parent = parentLocation.node;
  const children = [...(parent.children ?? [])];
  const oldIndex = children.findIndex((child) => child.id === activeNodeId);
  const newIndex = children.findIndex((child) => child.id === overNodeId);
  if (oldIndex < 0 || newIndex < 0) {
    return course;
  }
  const [moved] = children.splice(oldIndex, 1);
  children.splice(newIndex, 0, moved);
  parent.children = children;
  return draft;
}

export function parentIdForCourseNode(root: CourseNodeV1, nodeId: string): string | null {
  const location = findCourseNode(root, nodeId);
  return location?.parent?.id ?? null;
}

export function duplicateCourseNode(
  course: CourseV1,
  nodeId: string,
  pageIdMap: Record<string, string>,
): { course: CourseV1; nodeId: string } {
  const location = findCourseNode(course.root, nodeId);
  if (location == null) {
    throw new Error(`Node "${nodeId}" not found`);
  }
  if (location.node.kind === "book") {
    throw new Error("Cannot duplicate the book root");
  }

  const draft = cloneCourse(course);
  const parentLocation = findCourseNode(draft.root, location.parent!.id);
  if (parentLocation?.node == null) {
    throw new Error("Parent missing after clone");
  }

  const cloneSubtree = (node: CourseNodeV1): CourseNodeV1 => {
    const newId = nextCourseNodeId(node.kind, draft);
    let pageId = node.pageId;
    if (pageId != null) {
      if (pageIdMap[pageId] == null) {
        pageIdMap[pageId] = nextCoursePageId(`${node.title} copy`, draft);
      }
      pageId = pageIdMap[pageId];
    }
    return {
      ...node,
      id: newId,
      title: `${node.title} (copy)`,
      pageId,
      children: node.children?.map(cloneSubtree),
    };
  };

  const duplicate = cloneSubtree(location.node);
  parentLocation.node.children = [...(parentLocation.node.children ?? []), duplicate];
  return { course: draft, nodeId: duplicate.id };
}
