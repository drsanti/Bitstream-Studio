import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import {
  patchSensorTelemetryCardAppearance,
  resolveSensorTelemetryCardEffectiveAppearance,
  resolveSensorTelemetryCardEffectiveColors,
} from "../../src/webview/course-studio/schemas/sensorTelemetryCardAppearance";
import {
  patchSensorTelemetryCardBlockColor,
  stripSensorTelemetryCardBlockColorsMatchingThemeDefaults,
  SENSOR_TELEMETRY_CARD_BLOCK_COLOR_THEME_DEFAULTS,
  sensorTelemetryCardBlockColorsToStyle,
} from "../../src/webview/course-studio/schemas/sensorTelemetryCardBlockColors";
import { applySensorTelemetryCardColorsToPageBlocks } from "../../src/webview/course-studio/maintainer/pageBlockColorActions";
import {
  parseSensorTelemetryCardBlockColorsClipboard,
  serializeSensorTelemetryCardBlockColorsClipboard,
} from "../../src/webview/course-studio/schemas/sensorTelemetryCardBlockColorsClipboard";

describe("sensorTelemetryCardAppearance", () => {
  it("parsePageV1 accepts sensor card appearance", () => {
    const page = parsePageV1({
      version: 1,
      id: "sensor-appearance",
      title: "Appearance",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "card-1",
          kind: "sensor-telemetry-card",
          placement: { column: 1, row: 1, columnSpan: 5, rowSpan: 3 },
          preset: "euler",
          appearance: {
            shell: "accent-emerald",
            colors: { background: "#0f172a", border: "#334155" },
            showUpdateBadge: false,
          },
        },
      ],
    });
    const block = page.blocks[0];
    assert.equal(block.kind, "sensor-telemetry-card");
    if (block.kind === "sensor-telemetry-card") {
      assert.equal(block.appearance?.shell, "accent-emerald");
      assert.equal(block.appearance?.showUpdateBadge, false);
    }
  });

  it("merges page default colors with block overrides", () => {
    assert.deepEqual(
      resolveSensorTelemetryCardEffectiveColors(
        { colors: { title: "#ffffff" } },
        { background: "#111111" },
      ),
      { background: "#111111", title: "#ffffff" },
    );
  });

  it("maps sensor card colors to CSS variables", () => {
    assert.deepEqual(
      sensorTelemetryCardBlockColorsToStyle({
        background: "#0f172a",
        border: "#334155",
        title: "#f8fafc",
      }),
      {
        "--course-sensor-card-bg": "#0f172a",
        "--course-sensor-card-border": "#334155",
        "--course-sensor-card-title": "#f8fafc",
      },
    );
  });

  it("resolveSensorTelemetryCardEffectiveAppearance applies defaults", () => {
    const resolved = resolveSensorTelemetryCardEffectiveAppearance(undefined, undefined);
    assert.equal(resolved.shell, "solid");
    assert.equal(resolved.showUpdateBadge, true);
    assert.equal(resolved.showDisplaySettings, true);
    assert.equal(resolved.defaultCollapsed, false);
  });

  it("applySensorTelemetryCardColorsToPageBlocks merges onto appearance.colors", () => {
    const page = parsePageV1({
      version: 1,
      id: "bulk-colors",
      title: "Bulk",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "card-1",
          kind: "sensor-telemetry-card",
          placement: { column: 1, row: 1, columnSpan: 4, rowSpan: 3 },
          preset: "pressure",
        },
      ],
    });
    const next = applySensorTelemetryCardColorsToPageBlocks(
      page,
      patchSensorTelemetryCardBlockColor(undefined, "background", "#101010"),
      "merge",
    );
    const block = next[0];
    assert.equal(block?.kind, "sensor-telemetry-card");
    if (block?.kind === "sensor-telemetry-card") {
      assert.equal(block.appearance?.colors?.background, "#101010");
    }
  });

  it("patchSensorTelemetryCardAppearance clears colors when colors is undefined", () => {
    assert.deepEqual(
      patchSensorTelemetryCardAppearance(
        { colors: { background: "#101010" }, showUpdateBadge: false },
        { colors: undefined },
      ),
      { showUpdateBadge: false },
    );
  });

  it("patchSensorTelemetryCardBlockColor drops theme-default hex", () => {
    assert.deepEqual(
      patchSensorTelemetryCardBlockColor(undefined, "background", "#000000ad"),
      undefined,
    );
    assert.deepEqual(
      patchSensorTelemetryCardBlockColor(
        { title: "#ffffff" },
        "background",
        SENSOR_TELEMETRY_CARD_BLOCK_COLOR_THEME_DEFAULTS.background,
      ),
      { title: "#ffffff" },
    );
  });

  it("stripSensorTelemetryCardBlockColorsMatchingThemeDefaults removes default-equivalent keys", () => {
    assert.equal(
      stripSensorTelemetryCardBlockColorsMatchingThemeDefaults({
        background: "#000000ad",
        border: "#00000000",
        title: "#f0f0f0",
        headerBackground: "#00000000",
      }),
      undefined,
    );
    assert.deepEqual(
      stripSensorTelemetryCardBlockColorsMatchingThemeDefaults({
        background: "#000000ad",
        title: "#ffffff",
      }),
      { title: "#ffffff" },
    );
  });

  it("serializes and parses sensor card color clipboard envelope", () => {
    const raw = serializeSensorTelemetryCardBlockColorsClipboard({
      background: "#191919",
      border: "#1f1f1f",
    });
    assert.deepEqual(parseSensorTelemetryCardBlockColorsClipboard(raw), {
      background: "#191919",
      border: "#1f1f1f",
    });
    assert.equal(parseSensorTelemetryCardBlockColorsClipboard('{"kind":"other"}'), null);
  });
});
