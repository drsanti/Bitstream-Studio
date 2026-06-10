import { AlignLeft, Globe, type LucideIcon } from "lucide-react";
import type { TRNSelectOption } from "../../ui/TRN/TRNSelect";
import type { PageBlockV1 } from "../schemas/page.v1";

export type HtmlPageBlockSourceMode = "inline" | "url";

export const HTML_PAGE_SOURCE_SELECT_ICON_CLASS = "h-3.5 w-3.5 shrink-0 text-zinc-400";

const SOURCE_META: Record<HtmlPageBlockSourceMode, { label: string; Icon: LucideIcon }> = {
  inline: { label: "Inline HTML", Icon: AlignLeft },
  url: { label: "Remote URL", Icon: Globe },
};

export const DEFAULT_INLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Demo</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      margin: 1.25rem;
      color: #e4e4e7;
      background: #18181b;
    }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
    p { margin: 0; color: #a1a1aa; }
  </style>
</head>
<body>
  <h1>HTML page</h1>
  <p>Edit in the HTML Editor workbench pane.</p>
</body>
</html>`;

export const DEFAULT_HTML_PAGE_URL =
  "https://github.com/user/repo/blob/main/demo/page.html";

export function resolveHtmlPageSourceMode(
  block: Pick<Extract<PageBlockV1, { kind: "html-page" }>, "url" | "html">,
): HtmlPageBlockSourceMode {
  if (block.url != null && block.url.length > 0) {
    return "url";
  }
  return "inline";
}

export function buildHtmlPageSourceSelectOptions(): TRNSelectOption[] {
  return (Object.keys(SOURCE_META) as HtmlPageBlockSourceMode[]).map((mode) => {
    const { label, Icon } = SOURCE_META[mode];
    return {
      value: mode,
      label,
      icon: <Icon className={HTML_PAGE_SOURCE_SELECT_ICON_CLASS} aria-hidden />,
    };
  });
}

export function patchHtmlPageSourceMode(
  block: Extract<PageBlockV1, { kind: "html-page" }>,
  mode: HtmlPageBlockSourceMode,
): Partial<Extract<PageBlockV1, { kind: "html-page" }>> {
  if (mode === "inline") {
    return {
      url: undefined,
      html: block.html ?? DEFAULT_INLINE_HTML,
    };
  }
  return {
    url: block.url ?? DEFAULT_HTML_PAGE_URL,
    html: undefined,
  };
}
