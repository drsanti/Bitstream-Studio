import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOfficialFlowLibraryNavigate,
  useFlowLibraryNavigationStore,
} from "../../src/webview/sensor-studio/features/editor/flow-library/flow-library-navigation";

test("buildOfficialFlowLibraryNavigate targets Saved → Flows → Official preset row", () => {
  const payload = buildOfficialFlowLibraryNavigate("signal-chain");
  assert.equal(payload.savedTab, "flows");
  assert.equal(payload.scrollToOfficial, true);
  assert.equal(payload.highlightPresetId, "official-signal-chain");
});

test("useFlowLibraryNavigationStore increments seq on requestNavigate", () => {
  useFlowLibraryNavigationStore.getState().clearNavigate();
  const before = useFlowLibraryNavigationStore.getState().seq;
  useFlowLibraryNavigationStore.getState().requestNavigate({
    savedTab: "flows",
    scrollToOfficial: true,
  });
  const after = useFlowLibraryNavigationStore.getState().seq;
  assert.equal(after, before + 1);
  assert.equal(useFlowLibraryNavigationStore.getState().payload?.savedTab, "flows");
  useFlowLibraryNavigationStore.getState().clearNavigate();
});
