import type { PageBlockV1, PageV1 } from "../schemas/page.v1";

export function htmlPageTelemetryProviderExampleBlock(opts: {
  id: string;
  title: string;
  caption?: string;
  placement: PageBlockV1["placement"];
  html: string;
}): Extract<PageBlockV1, { kind: "html-page" }> {
  return {
    id: opts.id,
    kind: "html-page",
    placement: opts.placement,
    title: opts.title,
    caption: opts.caption,
    readHeight: "content",
    html: opts.html,
  };
}

export function withTelemetryProviderHtmlExample(
  page: PageV1,
  block: Extract<PageBlockV1, { kind: "html-page" }>,
): PageV1 {
  return {
    ...page,
    blocks: [...page.blocks, block],
  };
}
