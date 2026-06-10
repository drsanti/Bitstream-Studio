import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  COURSE_CALLOUT_ICON_DEFAULT,
  COURSE_TITLE_ICON_NONE,
  calloutIconSelectValue,
  optionalTitleIconSelectValue,
  patchTitleIconFromSelect,
  resolveCourseLucideIcon,
  resolveCourseTitlePrefixIcon,
} from "../../src/webview/course-studio/schemas/courseTitleIcon";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import { Activity } from "lucide-react";

describe("courseTitleIcon", () => {
  test("resolveCourseLucideIcon returns catalog and unknown lucide icons", () => {
    assert.ok(resolveCourseLucideIcon("LayoutDashboard") != null);
    assert.ok(resolveCourseLucideIcon("Lightbulb") != null);
    assert.equal(resolveCourseLucideIcon(COURSE_TITLE_ICON_NONE), null);
    assert.equal(resolveCourseLucideIcon(undefined), null);
  });

  test("resolveCourseTitlePrefixIcon honors explicit none and fallback", () => {
    assert.equal(resolveCourseTitlePrefixIcon(COURSE_TITLE_ICON_NONE, Activity), null);
    assert.equal(resolveCourseTitlePrefixIcon(undefined, Activity), Activity);
    assert.ok(resolveCourseTitlePrefixIcon("Gauge", Activity) != null);
  });

  test("patchTitleIconFromSelect maps optional and callout modes", () => {
    assert.deepEqual(patchTitleIconFromSelect("", "optional"), { icon: undefined });
    assert.deepEqual(patchTitleIconFromSelect("Workflow", "optional"), { icon: "Workflow" });
    assert.deepEqual(patchTitleIconFromSelect(COURSE_CALLOUT_ICON_DEFAULT, "callout"), {
      icon: undefined,
    });
    assert.deepEqual(patchTitleIconFromSelect(COURSE_TITLE_ICON_NONE, "callout"), {
      icon: COURSE_TITLE_ICON_NONE,
    });
    assert.deepEqual(patchTitleIconFromSelect("Info", "callout"), { icon: "Info" });
  });

  test("callout and optional select values round-trip", () => {
    assert.equal(calloutIconSelectValue(undefined), COURSE_CALLOUT_ICON_DEFAULT);
    assert.equal(calloutIconSelectValue("Lightbulb"), "Lightbulb");
    assert.equal(calloutIconSelectValue(COURSE_TITLE_ICON_NONE), COURSE_TITLE_ICON_NONE);
    assert.equal(optionalTitleIconSelectValue(undefined), "");
    assert.equal(optionalTitleIconSelectValue("Briefcase"), "Briefcase");
  });

  test("parsePageV1 accepts iconColor on title-bearing blocks", () => {
    const page = parsePageV1({
      version: 1,
      id: "icon-color-test",
      title: "Icon colors",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "heading-1",
          kind: "heading",
          placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 2 },
          title: "Heading",
          iconColor: "#ffaa00",
        },
        {
          id: "callout-1",
          kind: "callout-tip",
          placement: { column: 1, row: 3, columnSpan: 12, rowSpan: 2 },
          body: "Tip body",
          iconColor: "#a78bfa",
        },
        {
          id: "card-1",
          kind: "card",
          placement: { column: 1, row: 5, columnSpan: 6, rowSpan: 2 },
          title: "Card",
          body: "Body",
          colors: { icon: "#00ffaa" },
        },
      ],
    });

    assert.equal(page.blocks[0]?.kind === "heading" && page.blocks[0].iconColor, "#ffaa00");
    assert.equal(page.blocks[1]?.kind === "callout-tip" && page.blocks[1].iconColor, "#a78bfa");
    assert.equal(page.blocks[2]?.kind === "card" && page.blocks[2].colors?.icon, "#00ffaa");
  });

  test("parsePageV1 accepts icon on heading, card, and live-metric blocks", () => {
    const page = parsePageV1({
      version: 1,
      id: "icon-test",
      title: "Icons",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "heading-1",
          kind: "heading",
          placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 2 },
          title: "Heading",
          icon: "BookOpen",
        },
        {
          id: "card-1",
          kind: "card",
          placement: { column: 1, row: 3, columnSpan: 6, rowSpan: 2 },
          title: "Card",
          body: "Body",
          icon: "LayoutDashboard",
        },
        {
          id: "live-1",
          kind: "live-metric",
          placement: { column: 7, row: 3, columnSpan: 6, rowSpan: 2 },
          title: "Live",
          icon: COURSE_TITLE_ICON_NONE,
        },
      ],
    });

    assert.equal(page.blocks[0]?.kind === "heading" && page.blocks[0].icon, "BookOpen");
    assert.equal(page.blocks[1]?.kind === "card" && page.blocks[1].icon, "LayoutDashboard");
    assert.equal(page.blocks[2]?.kind === "live-metric" && page.blocks[2].icon, COURSE_TITLE_ICON_NONE);
  });
});
