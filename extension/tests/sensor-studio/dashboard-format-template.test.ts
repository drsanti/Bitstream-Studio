import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatDashboardNumericTemplate,
  formatDashboardTemplate,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-format-template";
import { readDashboardImageUrl } from "../../src/webview/sensor-studio/core/dashboard/dashboard-image-fit";

test("formatDashboardTemplate interpolates placeholders", () => {
  const text = formatDashboardTemplate("Temp {{value}} {{unit}}", {
    value: 23.4,
    unit: "°C",
  });
  assert.equal(text, "Temp 23.40 °C");
});

test("formatDashboardNumericTemplate formats value with decimals and fallback", () => {
  assert.equal(
    formatDashboardNumericTemplate({
      template: "{{value}} {{unit}}",
      value: 22.456,
      unit: "°C",
      decimals: 1,
      fallback: "—",
    }),
    "22.5 °C",
  );
  assert.equal(
    formatDashboardNumericTemplate({
      template: "{{value}}",
      value: null,
      fallback: "n/a",
    }),
    "n/a",
  );
});

test("readDashboardImageUrl prefers wired url", () => {
  assert.equal(
    readDashboardImageUrl({ imageUrl: "https://example.com/a.png" }, "https://wired.test/x.png"),
    "https://wired.test/x.png",
  );
  assert.equal(
    readDashboardImageUrl({ imageUrl: "https://example.com/a.png" }, ""),
    "https://example.com/a.png",
  );
});
