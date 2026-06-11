import assert from "node:assert/strict";
import test from "node:test";
import {
  coerceHeroRadialGaugeArcPreset,
  heroGaugeArcEndDeg,
  heroGaugeConicBackground,
  heroRadialGaugeArcGeometry,
  resolveHeroGaugeArcToColor,
} from "../../src/webview/course-studio/ui/catalog/widget-board/heroRadialGaugeConfig";
import { widgetBoardEntrySchema } from "../../src/webview/course-studio/schemas/widgetBoard.v1";

test("heroRadialGaugeArcGeometry maps presets to start and sweep", () => {
  assert.deepEqual(heroRadialGaugeArcGeometry("hero140"), { startDeg: 225, sweepDeg: 140 });
  assert.deepEqual(heroRadialGaugeArcGeometry("semicircle"), { startDeg: 180, sweepDeg: 180 });
  assert.deepEqual(heroRadialGaugeArcGeometry("wide"), { startDeg: 210, sweepDeg: 200 });
});

test("coerceHeroRadialGaugeArcPreset falls back to hero140", () => {
  assert.equal(coerceHeroRadialGaugeArcPreset("invalid"), "hero140");
  assert.equal(coerceHeroRadialGaugeArcPreset("wide"), "wide");
});

test("heroGaugeConicBackground includes preset start angle", () => {
  const hero = heroGaugeConicBackground(0.5, "hero140");
  const wide = heroGaugeConicBackground(0.5, "wide");
  assert.match(hero, /from 225deg/);
  assert.match(wide, /from 210deg/);
});

test("resolveHeroGaugeArcToColor uses theme token when zone tint is off", () => {
  assert.equal(
    resolveHeroGaugeArcToColor({ zoneTint: "off", value: 90, min: 0, max: 180 }),
    "var(--course-wb-gauge-arc-to)",
  );
});

test("resolveHeroGaugeArcToColor tints arc tip from traffic preset", () => {
  const color = resolveHeroGaugeArcToColor({
    zoneTint: "traffic",
    value: 170,
    min: 0,
    max: 180,
  });
  assert.equal(color, "#f87171");
});

test("heroGaugeArcEndDeg tracks fill ratio against preset sweep", () => {
  assert.equal(heroGaugeArcEndDeg(0.5, "hero140"), 225 + 70);
});

test("heroGaugeConicBackground accepts arc cap option without changing sweep geometry", () => {
  const butt = heroGaugeConicBackground(0.5, "hero140", { arcCap: "butt" });
  const round = heroGaugeConicBackground(0.5, "hero140", { arcCap: "round" });
  assert.match(butt, /from 225deg/);
  assert.match(round, /from 225deg/);
  assert.equal(butt, round);
});

test("widgetBoardEntrySchema applies hero radial gauge defaults", () => {
  const parsed = widgetBoardEntrySchema.parse({
    id: "gauge-1",
    kind: "hero-radial-gauge",
    placement: { column: 1, row: 1, columnSpan: 3, rowSpan: 3 },
  });
  assert.equal(parsed.kind, "hero-radial-gauge");
  if (parsed.kind !== "hero-radial-gauge") {
    return;
  }
  assert.equal(parsed.heroArcPreset, "hero140");
  assert.equal(parsed.showValue, true);
  assert.equal(parsed.showUnit, true);
  assert.equal(parsed.fillSmoothingMs, 0);
  assert.equal(parsed.holeSizePercent, 10);
  assert.equal(parsed.zoneTint, "off");
  assert.equal(parsed.showGlow, false);
  assert.equal(parsed.arcCap, "round");
});
