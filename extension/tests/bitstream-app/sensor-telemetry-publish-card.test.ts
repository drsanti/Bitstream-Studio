import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

test("telemetry publish Hz presets are not disabled when publishIntervalMs is 0", () => {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(
    path.join(
      dir,
      "../../src/webview/bitstream-app/components/shared/SensorTelemetryPublishCard.tsx",
    ),
    "utf8",
  );
  assert.doesNotMatch(
    src,
    /disabled=\{controlsDisabled \|\| publishIntervalMs === 0\}/,
    "Hz presets must stay clickable in Same-as-sampling mode so user can pick a rate",
  );
});
