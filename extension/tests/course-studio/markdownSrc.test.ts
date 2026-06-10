import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import {
  isRemoteMarkdownUrl,
  resolveRemoteMarkdownFetchUrl,
} from "../../src/webview/course-studio/content/remoteMarkdownUrl";

const PILOT_ACCEL_THEORY_MD_SRC = "pilot-bmi-accel-theory.theory.md";
const GITHUB_README_BLOB =
  "https://github.com/drsanti/node-animator/blob/main/README.md";
const GITHUB_REPO_ROOT = "https://github.com/drsanti/non-deegree-workshops-2025";
const GITHUB_REPO_README_RAW =
  "https://raw.githubusercontent.com/drsanti/non-deegree-workshops-2025/HEAD/README.md";

describe("markdown block src", () => {
  test("parsePageV1 accepts markdown block with src only", () => {
    const page = parsePageV1({
      version: 1,
      id: "test",
      title: "Test",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "md",
          kind: "markdown",
          placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 4 },
          src: PILOT_ACCEL_THEORY_MD_SRC,
        },
      ],
    });
    const block = page.blocks[0];
    assert.equal(block.kind, "markdown");
    if (block.kind !== "markdown") {
      return;
    }
    assert.equal(block.src, PILOT_ACCEL_THEORY_MD_SRC);
    assert.equal(block.markdown, undefined);
  });

  test("parsePageV1 accepts markdown block with url only", () => {
    const page = parsePageV1({
      version: 1,
      id: "test",
      title: "Test",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "md",
          kind: "markdown",
          placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 4 },
          url: GITHUB_README_BLOB,
        },
      ],
    });
    const block = page.blocks[0];
    assert.equal(block.kind, "markdown");
    if (block.kind !== "markdown") {
      return;
    }
    assert.equal(block.url, GITHUB_README_BLOB);
  });

  test("parsePageV1 rejects markdown block without markdown, src, or url", () => {
    assert.throws(() =>
      parsePageV1({
        version: 1,
        id: "test",
        title: "Test",
        grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
        blocks: [
          {
            id: "md",
            kind: "markdown",
            placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 4 },
          },
        ],
      }),
    );
  });
});

describe("remote markdown URL", () => {
  test("isRemoteMarkdownUrl detects http(s) URLs", () => {
    assert.equal(isRemoteMarkdownUrl(GITHUB_README_BLOB), true);
    assert.equal(isRemoteMarkdownUrl("pilot-bmi-accel-theory.theory.md"), false);
  });

  test("resolveRemoteMarkdownFetchUrl converts GitHub blob image links to raw", () => {
    const blob =
      "https://github.com/drsanti/ternion-3d-assets-free/blob/main/assets/textures/images/metal/Texturelabs_Metal_122M.jpg";
    assert.equal(
      resolveRemoteMarkdownFetchUrl(blob),
      "https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets/textures/images/metal/Texturelabs_Metal_122M.jpg",
    );
    assert.equal(
      resolveRemoteMarkdownFetchUrl(`${blob}?raw=true`),
      "https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets/textures/images/metal/Texturelabs_Metal_122M.jpg",
    );
  });

  test("resolveRemoteMarkdownFetchUrl converts GitHub blob links to raw", () => {
    assert.equal(
      resolveRemoteMarkdownFetchUrl(GITHUB_README_BLOB),
      "https://raw.githubusercontent.com/drsanti/node-animator/main/README.md",
    );
  });

  test("resolveRemoteMarkdownFetchUrl passes through raw GitHub URLs", () => {
    const raw = "https://raw.githubusercontent.com/drsanti/node-animator/main/README.md";
    assert.equal(resolveRemoteMarkdownFetchUrl(raw), raw);
  });

  test("resolveRemoteMarkdownFetchUrl resolves GitHub repo root to README.md", () => {
    assert.equal(resolveRemoteMarkdownFetchUrl(GITHUB_REPO_ROOT), GITHUB_REPO_README_RAW);
    assert.equal(
      resolveRemoteMarkdownFetchUrl(`${GITHUB_REPO_ROOT}/`),
      GITHUB_REPO_README_RAW,
    );
  });

  test("resolveRemoteMarkdownFetchUrl resolves GitHub blob README same as repo root", () => {
    const blobReadme =
      "https://github.com/drsanti/non-deegree-workshops-2025/blob/main/README.md";
    const fromBlob = resolveRemoteMarkdownFetchUrl(blobReadme);
    const fromRoot = resolveRemoteMarkdownFetchUrl(GITHUB_REPO_ROOT);
    assert.equal(fromBlob, "https://raw.githubusercontent.com/drsanti/non-deegree-workshops-2025/main/README.md");
    assert.equal(fromRoot, GITHUB_REPO_README_RAW);
  });

  test("resolveRemoteMarkdownFetchUrl resolves GitHub tree branch root to README.md", () => {
    assert.equal(
      resolveRemoteMarkdownFetchUrl("https://github.com/drsanti/non-deegree-workshops-2025/tree/main"),
      "https://raw.githubusercontent.com/drsanti/non-deegree-workshops-2025/main/README.md",
    );
  });
});
