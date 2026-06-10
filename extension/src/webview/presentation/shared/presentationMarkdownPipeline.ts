/**
 * Presentation / Course Studio markdown pipeline.
 *
 * Math standard: **StackEdit + Obsidian** (not GitHub MathJax).
 * - Engine: KaTeX via `remark-math` + `rehype-katex`
 * - Inline: `$…$`
 * - Block: `$$…$$` on its own lines
 * - Optional fenced: ` ```math ` (remark-math; StackEdit-compatible)
 *
 * GitHub-only syntax (`\(...\)`, `\[` `\]` as primary) is intentionally not targeted.
 * @see https://stackedit.io/
 * @see https://help.obsidian.md/Editing+and+formatting/Advanced+formatting+syntax#Math
 */
import type { PluggableList } from "unified";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export const COURSE_MARKDOWN_MATH_STANDARD = "stackedit-obsidian-katex" as const;

/** Author-facing delimiter summary (toolbar hints, status bar). */
export const COURSE_MARKDOWN_MATH_DELIMITERS = {
  inline: "$…$",
  block: "$$…$$",
  fenced: "```math",
} as const;

export const COURSE_MARKDOWN_MATH_STATUS_LABEL = "GFM · KaTeX · Mermaid";

const REMARK_MATH_OPTIONS = {
  /** Obsidian / StackEdit default — single `$` opens inline math. */
  singleDollarTextMath: true,
} as const;

const REHYPE_KATEX_OPTIONS = {
  /** Obsidian-like: render what KaTeX can; ignore unsupported macros when possible. */
  strict: "ignore" as const,
};

export function presentationRemarkPlugins(): PluggableList {
  return [remarkGfm, [remarkMath, REMARK_MATH_OPTIONS]];
}

export function presentationRehypePlugins(): PluggableList {
  return [[rehypeKatex, REHYPE_KATEX_OPTIONS]];
}

export function isPresentationMathCodeClass(className: string | undefined): boolean {
  if (className == null) {
    return false;
  }
  return (
    className.includes("language-math") ||
    className.includes("math-inline") ||
    className.includes("math-display")
  );
}
