import { AlignLeft, FileText, Globe, type LucideIcon } from "lucide-react";
import type { TRNSelectOption } from "../../ui/TRN/TRNSelect";
import type { PageBlockV1 } from "../schemas/page.v1";

export type MarkdownBlockSourceMode = "inline" | "file" | "url";

export const MARKDOWN_SOURCE_SELECT_ICON_CLASS = "h-3.5 w-3.5 shrink-0 text-zinc-400";

const SOURCE_META: Record<
  MarkdownBlockSourceMode,
  { label: string; Icon: LucideIcon }
> = {
  inline: { label: "Inline markdown", Icon: AlignLeft },
  file: { label: "Bundled file", Icon: FileText },
  url: { label: "Remote URL", Icon: Globe },
};

export function resolveMarkdownBlockSourceMode(
  block: Pick<Extract<PageBlockV1, { kind: "markdown" }>, "src" | "url" | "markdown">,
): MarkdownBlockSourceMode {
  if (block.src != null && block.src.length > 0) {
    return "file";
  }
  if (block.url != null && block.url.length > 0) {
    return "url";
  }
  return "inline";
}

export function buildMarkdownBlockSourceSelectOptions(): TRNSelectOption[] {
  return (Object.keys(SOURCE_META) as MarkdownBlockSourceMode[]).map((mode) => {
    const { label, Icon } = SOURCE_META[mode];
    return {
      value: mode,
      label,
      icon: <Icon className={MARKDOWN_SOURCE_SELECT_ICON_CLASS} aria-hidden />,
    };
  });
}

export const DEFAULT_INLINE_MARKDOWN = "## New section\n\nEdit markdown in the inspector.";
export const DEFAULT_MARKDOWN_FILE_SRC = "lesson.theory.md";
export const DEFAULT_MARKDOWN_URL = "https://github.com/user/repo";

export function patchMarkdownBlockSourceMode(
  block: Extract<PageBlockV1, { kind: "markdown" }>,
  mode: MarkdownBlockSourceMode,
): Partial<Extract<PageBlockV1, { kind: "markdown" }>> {
  if (mode === "inline") {
    return {
      src: undefined,
      url: undefined,
      markdown: block.markdown ?? DEFAULT_INLINE_MARKDOWN,
    };
  }
  if (mode === "file") {
    return {
      src: block.src ?? DEFAULT_MARKDOWN_FILE_SRC,
      url: undefined,
      markdown: undefined,
    };
  }
  return {
    url: block.url ?? DEFAULT_MARKDOWN_URL,
    src: undefined,
    markdown: undefined,
  };
}
