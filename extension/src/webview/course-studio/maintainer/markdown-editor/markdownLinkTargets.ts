import { COURSE_MARKDOWN_BUNDLED_SRCS } from "../../content/courseMarkdownBundledSrcs";
import type { PageBlockV1 } from "../../schemas/page.v1";
import { parseMarkdownHeadings } from "./markdownEditorOutline";

export type MarkdownLinkTarget = {
  id: string;
  label: string;
  href: string;
  hint?: string;
};

export function slugifyMarkdownHeading(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function listMarkdownLinkTargets(
  page: { blocks: PageBlockV1[] } | null | undefined,
  currentMarkdown?: string,
): MarkdownLinkTarget[] {
  const targets: MarkdownLinkTarget[] = [];
  const seen = new Set<string>();

  const add = (href: string, label: string, hint?: string) => {
    if (seen.has(href)) {
      return;
    }
    seen.add(href);
    targets.push({ id: href, label, href, hint });
  };

  if (currentMarkdown != null && currentMarkdown.length > 0) {
    for (const heading of parseMarkdownHeadings(currentMarkdown)) {
      const slug = slugifyMarkdownHeading(heading.title);
      if (slug.length === 0) {
        continue;
      }
      add(`#${slug}`, heading.title, `This document · line ${heading.line}`);
    }
  }

  for (const src of COURSE_MARKDOWN_BUNDLED_SRCS) {
    add(src, src, "Bundled theory markdown");
  }

  if (page != null) {
    for (const block of page.blocks) {
      if (block.kind === "markdown") {
        if (block.src != null) {
          add(block.src, block.src, `Block ${block.id}`);
        }
        if (block.url != null) {
          add(block.url, block.url, `Remote · ${block.id}`);
        }
      }
    }
    for (const block of page.blocks) {
      if (block.kind === "heading" && block.title.length > 0) {
        const slug = slugifyMarkdownHeading(block.title);
        if (slug.length > 0) {
          add(`#${slug}`, block.title, `Page heading · ${block.id}`);
        }
      }
    }
  }

  add("https://", "External URL (https://)", "Enter a full URL in the field below");

  return targets;
}
