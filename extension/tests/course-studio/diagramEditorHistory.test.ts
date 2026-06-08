import assert from "node:assert/strict";
import { test } from "node:test";
import pilotMemsDiagramJson from "../../src/webview/course-studio/content/pilot-bmi-accel-mems.diagram.v1.json";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import {
  canRedoDiagramHistory,
  canUndoDiagramHistory,
  EMPTY_DIAGRAM_HISTORY,
  pushDiagramHistorySnapshot,
  redoDiagramHistory,
  undoDiagramHistory,
} from "../../src/webview/course-studio/runtime/diagram/diagramEditorHistory";

test("pushDiagramHistorySnapshot clears redo stack", () => {
  const diagram = parseDiagramV1(pilotMemsDiagramJson);
  const stacks = pushDiagramHistorySnapshot(
    { undo: [diagram], redo: [diagram] },
    diagram,
  );
  assert.equal(stacks.undo.length, 2);
  assert.equal(stacks.redo.length, 0);
});

test("undoDiagramHistory restores previous draft and pushes current to redo", () => {
  const before = parseDiagramV1(pilotMemsDiagramJson);
  const after = parseDiagramV1({
    ...pilotMemsDiagramJson,
    nodes: pilotMemsDiagramJson.nodes.map((node) =>
      node.id === "proof-mass" && node.type === "rect"
        ? { ...node, x: 999 }
        : node,
    ),
  });
  const stacks = pushDiagramHistorySnapshot(EMPTY_DIAGRAM_HISTORY, before);
  const undone = undoDiagramHistory(stacks, after);
  assert.ok(undone.draft != null);
  assert.equal(undone.draft.nodes.find((node) => node.id === "proof-mass")?.type === "rect"
    ? (undone.draft.nodes.find((node) => node.id === "proof-mass") as { x: number }).x
    : null, before.nodes.find((node) => node.id === "proof-mass")?.type === "rect"
    ? (before.nodes.find((node) => node.id === "proof-mass") as { x: number }).x
    : null);
  assert.equal(canUndoDiagramHistory(undone.stacks), false);
  assert.equal(canRedoDiagramHistory(undone.stacks), true);
});

test("redoDiagramHistory reapplies undone draft", () => {
  const before = parseDiagramV1(pilotMemsDiagramJson);
  const after = parseDiagramV1({
    ...pilotMemsDiagramJson,
    nodes: pilotMemsDiagramJson.nodes.map((node) =>
      node.id === "proof-mass" && node.type === "rect"
        ? { ...node, x: 999 }
        : node,
    ),
  });
  const stacks = pushDiagramHistorySnapshot(EMPTY_DIAGRAM_HISTORY, before);
  const undone = undoDiagramHistory(stacks, after);
  const redone = redoDiagramHistory(undone.stacks, undone.draft!);
  assert.ok(redone.draft != null);
  assert.equal(
    redone.draft.nodes.find((node) => node.id === "proof-mass")?.type === "rect"
      ? (redone.draft.nodes.find((node) => node.id === "proof-mass") as { x: number }).x
      : null,
    after.nodes.find((node) => node.id === "proof-mass")?.type === "rect"
      ? (after.nodes.find((node) => node.id === "proof-mass") as { x: number }).x
      : null,
  );
});
