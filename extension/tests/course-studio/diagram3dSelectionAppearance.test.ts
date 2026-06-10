import assert from "node:assert/strict";
import test from "node:test";

import {
  applyScene3dSelectionPreset,
  buildScene3dSelectionPresetSelectOptions,
  DEFAULT_SCENE_3D_SELECTION_APPEARANCE,
  markScene3dSelectionAppearanceCustom,
  parseScene3dSelectionAppearancePrefs,
  resolveScene3dHighlightStyleForNode,
  resolveScene3dNodeHighlightRole,
  resolveScene3dOutlinerSelectionVisual,
  resolveScene3dRoleAppearance,
  scene3dOutlineThicknessFromLineWidth,
  shouldShowScene3dGroupOutline,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dSelectionAppearance";

test("resolveScene3dNodeHighlightRole prefers active over selected", () => {
  assert.equal(resolveScene3dNodeHighlightRole("a", ["a", "b"], "a"), "active");
  assert.equal(resolveScene3dNodeHighlightRole("b", ["a", "b"], "a"), "selected");
  assert.equal(resolveScene3dNodeHighlightRole("c", ["a"], "a"), "none");
});

test("resolveScene3dRoleAppearance respects enabled flag", () => {
  const disabled = { ...DEFAULT_SCENE_3D_SELECTION_APPEARANCE, enabled: false };
  assert.equal(resolveScene3dRoleAppearance(disabled, "selected"), null);
  assert.equal(resolveScene3dRoleAppearance(DEFAULT_SCENE_3D_SELECTION_APPEARANCE, "active")?.color, "#f59e0b");
});

test("shouldShowScene3dGroupOutline gates group rows", () => {
  assert.equal(shouldShowScene3dGroupOutline("group3d", "selected", false), false);
  assert.equal(shouldShowScene3dGroupOutline("model", "selected", false), true);
});

test("resolveScene3dHighlightStyleForNode uses box for groups when silhouette requested", () => {
  assert.equal(
    resolveScene3dHighlightStyleForNode(
      { ...DEFAULT_SCENE_3D_SELECTION_APPEARANCE, style: "silhouette" },
      "group3d",
    ),
    "box",
  );
});

test("applyScene3dSelectionPreset high contrast", () => {
  const preset = applyScene3dSelectionPreset("highContrast");
  assert.equal(preset.selected.color, "#ffffff");
  assert.equal(preset.active.lineWidth, 3);
});

test("parseScene3dSelectionAppearancePrefs clamps invalid values", () => {
  const parsed = parseScene3dSelectionAppearancePrefs({
    selected: { color: "bad", opacity: 9, lineWidth: 99 },
    style: "nope",
  });
  assert.equal(parsed.selected.color, DEFAULT_SCENE_3D_SELECTION_APPEARANCE.selected.color);
  assert.equal(parsed.selected.opacity, 1);
  assert.equal(parsed.selected.lineWidth, 4);
  assert.equal(parsed.style, DEFAULT_SCENE_3D_SELECTION_APPEARANCE.style);
});

test("resolveScene3dOutlinerSelectionVisual syncs custom colors", () => {
  const prefs = applyScene3dSelectionPreset("monochrome");
  const active = resolveScene3dOutlinerSelectionVisual(prefs, false, true, false);
  assert.equal(active.showActiveBadge, true);
  assert.match(active.className, /font-semibold/);
  assert.equal(active.style?.color, prefs.active.color);
});

test("scene3dOutlineThicknessFromLineWidth scales with line weight", () => {
  assert.ok(scene3dOutlineThicknessFromLineWidth(1) < scene3dOutlineThicknessFromLineWidth(4));
});

test("buildScene3dSelectionPresetSelectOptions includes disabled Custom row", () => {
  const options = buildScene3dSelectionPresetSelectOptions();
  const custom = options.find((option) => option.value === "custom");
  assert.ok(custom != null);
  assert.equal(custom.disabled, true);
  assert.equal(custom.label, "Custom");
});

test("markScene3dSelectionAppearanceCustom preserves existing custom preset", () => {
  const custom = markScene3dSelectionAppearanceCustom({
    ...DEFAULT_SCENE_3D_SELECTION_APPEARANCE,
    presetId: "custom",
    selected: { ...DEFAULT_SCENE_3D_SELECTION_APPEARANCE.selected, color: "#112233" },
  });
  assert.equal(custom.presetId, "custom");
  assert.equal(custom.selected.color, "#112233");

  const fromBlender = markScene3dSelectionAppearanceCustom(
    applyScene3dSelectionPreset("blender"),
  );
  assert.equal(fromBlender.presetId, "custom");
});
