import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createBlankCoursePage } from "../../src/webview/course-studio/content/loadBlankPage";
import { createPageBlock } from "../../src/webview/course-studio/maintainer/blockFactory";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import { injectHtmlPageAutoHeightScript } from "../../src/webview/course-studio/schemas/htmlPageAutoHeight";
import {
  htmlPageReadContentHeightPx,
  htmlPageShellHeightForRead,
  htmlPageUsesReadContentHeight,
  resolveHtmlPageSandboxAttr,
  wrapHtmlDocumentIfNeeded,
} from "../../src/webview/course-studio/schemas/htmlPageBlocks";
import {
  patchHtmlPageSourceMode,
  resolveHtmlPageSourceMode,
} from "../../src/webview/course-studio/maintainer/htmlPageBlockSource";
import { resolveRemoteHtmlFetchUrl } from "../../src/webview/course-studio/content/remoteHtmlUrl";

test("injectHtmlPageAutoHeightScript appends resize reporter once", () => {
  const html = "<!DOCTYPE html><html><body><p>Hi</p></body></html>";
  const injected = injectHtmlPageAutoHeightScript(html);
  assert.match(injected, /course-html-page-height/);
  assert.equal(injectHtmlPageAutoHeightScript(injected), injected);
});

test("wrapHtmlDocumentIfNeeded wraps fragments and preserves full documents", () => {
  assert.match(wrapHtmlDocumentIfNeeded("<p>Hi</p>"), /<html[\s>]/i);
  assert.match(wrapHtmlDocumentIfNeeded("<!DOCTYPE html><html><body></body></html>"), /<!DOCTYPE html>/i);
});

test("resolveHtmlPageSandboxAttr defaults to scripts on", () => {
  assert.equal(resolveHtmlPageSandboxAttr(), "allow-scripts");
  assert.equal(resolveHtmlPageSandboxAttr({ sandboxSameOrigin: true }), "allow-scripts allow-same-origin");
});

test("parsePageV1 accepts html-page inline and url modes", () => {
  const inline = parsePageV1({
    version: 1,
    id: "html-inline",
    title: "HTML",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "html-1",
        kind: "html-page",
        placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 4 },
        html: "<!DOCTYPE html><html><body>Hi</body></html>",
      },
    ],
  });
  assert.equal(inline.blocks[0]?.kind, "html-page");

  const remote = parsePageV1({
    version: 1,
    id: "html-url",
    title: "HTML",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "html-2",
        kind: "html-page",
        placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 4 },
        url: "https://github.com/user/repo/blob/main/demo/page.html",
        captionPlacement: "hidden",
      },
    ],
  });
  const block = remote.blocks[0];
  assert.equal(block?.kind, "html-page");
  if (block?.kind === "html-page") {
    assert.equal(block.captionPlacement, "hidden");
  }
});

test("createPageBlock html-page defaults to inline HTML", () => {
  const page = createBlankCoursePage();
  const block = createPageBlock("html-page", page);
  assert.equal(block.kind, "html-page");
  if (block.kind === "html-page") {
    assert.equal(resolveHtmlPageSourceMode(block), "inline");
    assert.ok((block.html ?? "").includes("<!DOCTYPE html>"));
    assert.equal(block.url, undefined);
  }
});

test("patchHtmlPageSourceMode switches between inline and url", () => {
  const page = createBlankCoursePage();
  const block = createPageBlock("html-page", page);
  if (block.kind !== "html-page") {
    throw new Error("expected html-page");
  }
  const urlPatch = patchHtmlPageSourceMode(block, "url");
  assert.ok(urlPatch.url != null);
  assert.equal(urlPatch.html, undefined);
  const inlinePatch = patchHtmlPageSourceMode({ ...block, ...urlPatch }, "inline");
  assert.ok((inlinePatch.html ?? "").length > 0);
  assert.equal(inlinePatch.url, undefined);
});

test("html-page readHeight defaults to auto content height", () => {
  const page = createBlankCoursePage();
  const block = createPageBlock("html-page", page);
  assert.equal(htmlPageShellHeightForRead(block), "content");
  assert.equal(htmlPageUsesReadContentHeight(block), true);
});

test("htmlPageReadContentHeightPx is undefined for auto and uses readHeightPx when fixed", () => {
  const page = createBlankCoursePage();
  const block = createPageBlock("html-page", page);
  if (block.kind !== "html-page") {
    throw new Error("expected html-page");
  }
  assert.equal(htmlPageReadContentHeightPx(block), undefined);
  assert.equal(htmlPageReadContentHeightPx({ ...block, readHeightPx: 640 }), 640);
});

test("resolveRemoteHtmlFetchUrl maps GitHub blob links to raw", () => {
  assert.equal(
    resolveRemoteHtmlFetchUrl("https://github.com/user/repo/blob/main/demo/page.html"),
    "https://raw.githubusercontent.com/user/repo/main/demo/page.html",
  );
});
