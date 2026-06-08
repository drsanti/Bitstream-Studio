import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

describe("page.v1 meta", () => {
  test("parsePageV1 accepts meta with telemetry and link health", () => {
    const page = parsePageV1({
      version: 1,
      id: "test",
      title: "Test",
      meta: {
        telemetryPreference: "simulator",
        defaultLinkHealth: "hide",
        staleMs: 3000,
      },
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "h",
          kind: "heading",
          placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 2 },
          title: "Hi",
        },
      ],
    });
    assert.equal(page.meta?.telemetryPreference, "simulator");
    assert.equal(page.meta?.defaultLinkHealth, "hide");
    assert.equal(page.meta?.staleMs, 3000);
  });
});
