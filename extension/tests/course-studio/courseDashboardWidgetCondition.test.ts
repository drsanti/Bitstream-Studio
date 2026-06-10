import assert from "node:assert/strict";
import test from "node:test";

import {
  readCourseDashboardWidgetCondition,
  resolveCourseDashboardWidgetActive,
} from "../../src/webview/course-studio/schemas/courseDashboardWidgetCondition";
import { resolveCourseDashboardStatusActive } from "../../src/webview/course-studio/schemas/courseDashboardWidgetKinds";

test("readCourseDashboardWidgetCondition defaults to >= 0.5", () => {
  const condition = readCourseDashboardWidgetCondition({});
  assert.equal(condition.compareOp, ">=");
  assert.equal(condition.compareValue, 0.5);
});

test("readCourseDashboardWidgetCondition reads legacy threshold key", () => {
  const condition = readCourseDashboardWidgetCondition({ threshold: 30 });
  assert.equal(condition.compareValue, 30);
  assert.equal(condition.compareOp, ">=");
});

test("readCourseDashboardWidgetCondition reads explicit compareOp and compareValue", () => {
  const condition = readCourseDashboardWidgetCondition({
    compareOp: "<",
    compareValue: 40,
  });
  assert.equal(condition.compareOp, "<");
  assert.equal(condition.compareValue, 40);
});

test("resolveCourseDashboardWidgetActive uses mapped displayValue", () => {
  assert.equal(
    resolveCourseDashboardWidgetActive({
      rawValue: 0.2,
      displayValue: 0.9,
      condition: { compareOp: ">=", compareValue: 0.5 },
    }),
    true,
  );
  assert.equal(
    resolveCourseDashboardWidgetActive({
      rawValue: 0.9,
      displayValue: 0.2,
      condition: { compareOp: ">=", compareValue: 0.5 },
    }),
    false,
  );
});

test("resolveCourseDashboardWidgetActive supports full compare operators", () => {
  assert.equal(
    resolveCourseDashboardWidgetActive({
      rawValue: 10,
      displayValue: 10,
      condition: { compareOp: "<", compareValue: 5 },
    }),
    false,
  );
  assert.equal(
    resolveCourseDashboardWidgetActive({
      rawValue: 3,
      displayValue: 3,
      condition: { compareOp: "<", compareValue: 5 },
    }),
    true,
  );
  assert.equal(
    resolveCourseDashboardWidgetActive({
      rawValue: 2,
      displayValue: 2,
      condition: { compareOp: "==", compareValue: 2 },
    }),
    true,
  );
  assert.equal(
    resolveCourseDashboardWidgetActive({
      rawValue: 2,
      displayValue: 2,
      condition: { compareOp: "!=", compareValue: 0 },
    }),
    true,
  );
});

test("resolveCourseDashboardWidgetActive bypasses compare for boolean paths", () => {
  assert.equal(
    resolveCourseDashboardWidgetActive({
      rawValue: false,
      displayValue: 1,
      condition: { compareOp: ">=", compareValue: 0.5 },
      bindingValueKind: "boolean",
    }),
    false,
  );
  assert.equal(
    resolveCourseDashboardWidgetActive({
      rawValue: true,
      displayValue: 0,
      condition: { compareOp: ">=", compareValue: 0.5 },
      bindingValueKind: "boolean",
    }),
    true,
  );
});

test("resolveCourseDashboardStatusActive remains backward compatible", () => {
  assert.equal(
    resolveCourseDashboardStatusActive({
      rawValue: true,
      displayValue: 1,
      threshold: 0.5,
    }),
    true,
  );
  assert.equal(
    resolveCourseDashboardStatusActive({
      rawValue: 0.8,
      displayValue: 0.8,
      threshold: 0.5,
    }),
    true,
  );
  assert.equal(
    resolveCourseDashboardStatusActive({
      rawValue: 0.2,
      displayValue: 0.2,
      threshold: 0.5,
      compareOp: "<",
    }),
    true,
  );
});
