import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  resolveFlowPresetOverrideDest,
  validateFlowPresetOverridePayload,
} from "../../scripts/flow-preset-override-io.mjs";

const extensionRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

test("resolveFlowPresetOverrideDest builds overrides path", () => {
  const dest = resolveFlowPresetOverrideDest(extensionRoot, "signal-chain");
  assert.match(dest, /flow-preset[/\\]overrides[/\\]signal-chain\.trn-flow-preset\.json$/);
});

test("validateFlowPresetOverridePayload accepts official id", () => {
  const result = validateFlowPresetOverridePayload("signal-chain", {
    marker: "trn-flow-preset",
    meta: { id: "official-signal-chain" },
  });
  assert.equal(result.ok, true);
  assert.equal(result.warning, undefined);
});

test("validateFlowPresetOverridePayload warns on id mismatch", () => {
  const result = validateFlowPresetOverridePayload("signal-chain", {
    marker: "trn-flow-preset",
    meta: { id: "official-other" },
  });
  assert.equal(result.ok, true);
  assert.match(result.warning ?? "", /official-other/);
});
