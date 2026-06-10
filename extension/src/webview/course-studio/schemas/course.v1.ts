import { z } from "zod";
import { courseThemesV1Schema, type CourseThemesV1 } from "./courseThemes.v1";

export const COURSE_NODE_KINDS = ["book", "chapter", "topic", "subtopic"] as const;
export type CourseNodeKindV1 = (typeof COURSE_NODE_KINDS)[number];

export type CourseNodeV1 = {
  id: string;
  kind: CourseNodeKindV1;
  title: string;
  /** Required for topic and subtopic nodes that own scrollable page content. */
  pageId?: string;
  children?: CourseNodeV1[];
};

export type CourseV1 = {
  version: 1;
  id: string;
  title: string;
  description?: string;
  themes?: CourseThemesV1;
  root: CourseNodeV1;
};

const courseNodeSchema: z.ZodType<CourseNodeV1> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    kind: z.enum(COURSE_NODE_KINDS),
    title: z.string().min(1),
    pageId: z.string().min(1).optional(),
    children: z.array(courseNodeSchema).optional(),
  }),
);

export const courseV1Schema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  themes: courseThemesV1Schema.optional(),
  root: courseNodeSchema,
});

function validateCourseNodeShape(node: CourseNodeV1, path: string, issues: string[]): void {
  const children = node.children ?? [];

  if (node.kind === "book") {
    if (node.pageId != null) {
      issues.push(`${path}: book node must not have pageId`);
    }
    for (const child of children) {
      if (child.kind !== "chapter") {
        issues.push(`${path}: book children must be chapters`);
      }
    }
  }

  if (node.kind === "chapter") {
    if (node.pageId != null) {
      issues.push(`${path}: chapter node must not have pageId`);
    }
    for (const child of children) {
      if (child.kind !== "topic" && child.kind !== "subtopic") {
        issues.push(`${path}: chapter children must be topics or subtopics`);
      }
    }
  }

  if (node.kind === "topic") {
    const hasPage = node.pageId != null && node.pageId.length > 0;
    const hasSubtopics = children.some((child) => child.kind === "subtopic");
    if (!hasPage && children.length === 0) {
      issues.push(`${path}: topic must have pageId or subtopic children`);
    }
    if (hasPage && hasSubtopics) {
      issues.push(`${path}: topic cannot combine pageId with subtopic children`);
    }
    for (const child of children) {
      if (child.kind !== "subtopic") {
        issues.push(`${path}: topic children must be subtopics`);
      }
    }
  }

  if (node.kind === "subtopic") {
    if (node.pageId == null || node.pageId.length === 0) {
      issues.push(`${path}: subtopic must have pageId`);
    }
    if (children.length > 0) {
      issues.push(`${path}: subtopic cannot have children`);
    }
  }

  for (let index = 0; index < children.length; index += 1) {
    validateCourseNodeShape(children[index]!, `${path}.children[${index}]`, issues);
  }
}

export function parseCourseV1(raw: unknown): CourseV1 {
  const parsed = courseV1Schema.parse(raw);
  const issues: string[] = [];
  if (parsed.root.kind !== "book") {
    issues.push("root must be a book node");
  }
  validateCourseNodeShape(parsed.root, "root", issues);
  if (issues.length > 0) {
    throw new Error(`Invalid course.v1: ${issues.join("; ")}`);
  }
  return parsed;
}
