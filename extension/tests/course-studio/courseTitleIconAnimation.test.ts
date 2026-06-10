import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  isCourseTitleIconAnimationActive,
  patchCourseTitleIconAnimation,
  resolveCourseTitleIconAnimation,
  stripEmptyCourseTitleIconAnimation,
} from "../../src/webview/course-studio/schemas/courseTitleIconAnimation";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

describe("courseTitleIconAnimation", () => {
  test("isCourseTitleIconAnimationActive is false for none or missing preset", () => {
    assert.equal(isCourseTitleIconAnimationActive(undefined), false);
    assert.equal(isCourseTitleIconAnimationActive({ preset: "none" }), false);
    assert.equal(isCourseTitleIconAnimationActive({ preset: "pulse" }), true);
  });

  test("resolveCourseTitleIconAnimation maps presets", () => {
    const pulse = resolveCourseTitleIconAnimation({ preset: "pulse" }, "#fafafa");
    assert.ok(pulse != null);
    assert.equal(pulse.motion?.scale, 1.12);

    const spin = resolveCourseTitleIconAnimation({ preset: "spin" }, undefined);
    assert.ok(spin != null);
    assert.equal(spin.motion?.rotation, 360);
    assert.equal(spin.yoyo, false);

    const custom = resolveCourseTitleIconAnimation(
      {
        preset: "custom",
        motion: { enabled: true, y: -4 },
        color: { enabled: false },
      },
      "#112233",
    );
    assert.ok(custom != null);
    assert.equal(custom.motion?.y, -4);
    assert.equal(custom.color, undefined);
  });

  test("resolveCourseTitleIconAnimation maps color cycle preset", () => {
    const cycle = resolveCourseTitleIconAnimation(
      {
        preset: "color-cycle",
        color: {
          colors: ["#111111", "#222222", "#333333"],
        },
      },
      "#fafafa",
    );
    assert.ok(cycle != null);
    assert.deepEqual(cycle.color?.cycle, ["#111111", "#222222", "#333333"]);
    assert.equal(cycle.yoyo, false);
  });

  test("patchCourseTitleIconColorChannel clears peak when colors are set", () => {
    const next = patchCourseTitleIconAnimation(
      { preset: "color-breathe", color: { to: "#ff0000" } },
      { color: { colors: ["#111111", "#222222"] } },
    );
    assert.deepEqual(next?.color?.colors, ["#111111", "#222222"]);
    assert.equal(next?.color?.to, undefined);
  });

  test("patch and strip remove none preset", () => {
    assert.equal(
      patchCourseTitleIconAnimation({ preset: "pulse" }, { preset: "none" }),
      undefined,
    );
    assert.equal(stripEmptyCourseTitleIconAnimation({ preset: "swing" })?.preset, "swing");
  });

  test("parsePageV1 accepts iconAnimation on title blocks", () => {
    const page = parsePageV1({
      version: 1,
      id: "anim",
      title: "Anim",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "card-1",
          kind: "card",
          placement: { column: 1, row: 1, columnSpan: 4, rowSpan: 2 },
          title: "Card",
          body: "Body",
          icon: "Workflow",
          iconAnimation: {
            preset: "float",
            duration: 2,
            ease: "sine.inOut",
          },
        },
      ],
    });
    const block = page.blocks[0];
    assert.equal(block.kind, "card");
    if (block.kind === "card") {
      assert.equal(block.iconAnimation?.preset, "float");
    }
  });
});
