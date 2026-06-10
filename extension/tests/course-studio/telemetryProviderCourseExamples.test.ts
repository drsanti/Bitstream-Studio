import assert from "node:assert/strict";
import test from "node:test";
import { loadBmi270LiveVisualizationPage } from "../../src/webview/course-studio/content/loadBmi270ChapterPages";
import { loadDps368LivePage } from "../../src/webview/course-studio/content/loadDps368ChapterPages";
import { loadSht40LivePage } from "../../src/webview/course-studio/content/loadSht40ChapterPages";

function findHtmlExample(
  page: ReturnType<typeof loadSht40LivePage>,
  id: string,
) {
  return page.blocks.find((b) => b.kind === "html-page" && b.id === id);
}

test("live chapter pages bundle telemetry provider HTML examples", () => {
  const sht40 = findHtmlExample(loadSht40LivePage(), "telemetry-sht40-humidity-bar");
  assert.ok(sht40);
  assert.match(sht40.html ?? "", /humidityPct/);
  assert.match(sht40.html ?? "", /bitstream:ready/);

  const dps = findHtmlExample(loadDps368LivePage(), "telemetry-dps368-pressure-bar");
  assert.ok(dps);
  assert.match(dps.html ?? "", /pressureHpa/);

  const bmi = findHtmlExample(loadBmi270LiveVisualizationPage(), "telemetry-bmi270-gyro-bar");
  assert.ok(bmi);
  assert.match(bmi.html ?? "", /gyroX/);
  assert.match(bmi.html ?? "", /bmi270\.mode\.set/);
});
