import { strict as assert } from "node:assert";
import test from "node:test";

import { createPageBlock } from "../../src/webview/course-studio/maintainer/blockFactory";
import { PAGE_BLOCK_PALETTE } from "../../src/webview/course-studio/maintainer/blockPaletteMeta";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import {
  buildYoutubeEmbedUrl,
  parseYoutubeVideoId,
  resolveYoutubeCropInsets,
  youtubeEmbedOptionsFromBlock,
} from "../../src/webview/course-studio/schemas/embedBlocks";
import { resolveEmbedCaptionDisplay } from "../../src/webview/course-studio/ui/catalog/course-embed-card-ui";
import { createBlankCoursePage } from "../../src/webview/course-studio/content/loadBlankPage";

test("parseYoutubeVideoId accepts bare id and common URL shapes", () => {
  assert.equal(parseYoutubeVideoId("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(
    parseYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(parseYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(
    parseYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(parseYoutubeVideoId("not-a-url"), null);
});

test("buildYoutubeEmbedUrl applies playback and player options", () => {
  assert.equal(
    buildYoutubeEmbedUrl("FLCkGC7LHWs"),
    "https://www.youtube.com/embed/FLCkGC7LHWs?autoplay=1&mute=1&playsinline=1",
  );
  assert.equal(
    buildYoutubeEmbedUrl("FLCkGC7LHWs", { startSeconds: 30, autoplay: false }),
    "https://www.youtube.com/embed/FLCkGC7LHWs?start=30&playsinline=1",
  );
  assert.equal(
    buildYoutubeEmbedUrl("FLCkGC7LHWs", {
      autoplay: false,
      showControls: false,
      modestBranding: true,
      limitRelatedVideos: true,
      loop: true,
      allowFullscreen: false,
    }),
    "https://www.youtube.com/embed/FLCkGC7LHWs?controls=0&modestbranding=1&rel=0&loop=1&playlist=FLCkGC7LHWs&fs=0&playsinline=1",
  );
});

test("youtubeEmbedOptionsFromBlock maps legacy minimalChrome to cropChrome", () => {
  const page = createBlankCoursePage();
  const block = createPageBlock("youtube", page);
  const withLegacy = {
    ...block,
    minimalChrome: true as const,
  };
  const crop = resolveYoutubeCropInsets(youtubeEmbedOptionsFromBlock(withLegacy));
  assert.equal(crop.active, true);
  assert.equal(crop.topPx, 64);
  assert.equal(crop.bottomPx, 64);
});

test("parsePageV1 accepts youtube captionPlacement", () => {
  const page = parsePageV1({
    version: 1,
    id: "caption-placement",
    title: "Caption",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "yt-1",
        kind: "youtube",
        placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 4 },
        url: "dQw4w9WgXcQ",
        caption: "Hello",
        captionPlacement: "overlay",
      },
    ],
  });
  const block = page.blocks[0];
  assert.equal(block.kind, "youtube");
  if (block.kind === "youtube") {
    assert.equal(block.captionPlacement, "overlay");
  }
});

test("resolveEmbedCaptionDisplay renders overlay mode when placement is overlay", () => {
  const display = resolveEmbedCaptionDisplay("Hello caption", "overlay");
  assert.deepEqual(display, { text: "Hello caption", mode: "overlay" });
});

test("resolveEmbedCaptionDisplay renders above mode when placement is above", () => {
  const display = resolveEmbedCaptionDisplay("Hello caption", "above");
  assert.deepEqual(display, { text: "Hello caption", mode: "above" });
});

test("parsePageV1 accepts youtube captionPlacement above", () => {
  const page = parsePageV1({
    version: 1,
    id: "caption-placement-above",
    title: "Caption",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "yt-1",
        kind: "youtube",
        placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 4 },
        url: "dQw4w9WgXcQ",
        caption: "Hello",
        captionPlacement: "above",
      },
    ],
  });
  const block = page.blocks[0];
  assert.equal(block.kind, "youtube");
  if (block.kind === "youtube") {
    assert.equal(block.captionPlacement, "above");
  }
});

test("resolveEmbedCaptionDisplay hides caption when placement is hidden", () => {
  assert.equal(resolveEmbedCaptionDisplay("Hello caption", "hidden"), null);
});

test("resolveYoutubeCropInsets uses custom top and bottom values", () => {
  const crop = resolveYoutubeCropInsets({
    cropChrome: true,
    cropTopPx: 32,
    cropBottomPx: 72,
  });
  assert.equal(crop.active, true);
  assert.equal(crop.topPx, 32);
  assert.equal(crop.bottomPx, 72);
});

test("createPageBlock supports image, code, youtube, and iframe blocks", () => {
  const page = createBlankCoursePage();
  for (const kind of ["image", "code", "youtube", "iframe"] as const) {
    const block = createPageBlock(kind, page);
    assert.equal(block.kind, kind);
    const parsed = parsePageV1({
      ...page,
      blocks: [block],
    });
    assert.equal(parsed.blocks[0]?.kind, kind);
  }
});

test("PAGE_BLOCK_PALETTE includes embed and media blocks in grouped categories", () => {
  const kinds = PAGE_BLOCK_PALETTE.map((entry) => entry.kind);
  assert.ok(kinds.includes("image"));
  assert.ok(kinds.includes("code"));
  assert.ok(kinds.includes("youtube"));
  assert.ok(kinds.includes("iframe"));
  assert.equal(
    PAGE_BLOCK_PALETTE.filter((entry) => entry.category === "embed").length,
    2,
  );
});
