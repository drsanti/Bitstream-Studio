import assert from "node:assert/strict";
import test from "node:test";
import {
  computeResizedWindowRect,
  normalizeRect,
} from "../../src/webview/ui/TRN/TRNWindow";

test("computeResizedWindowRect — southeast grows width and height", () => {
  const base = { x: 100, y: 80, width: 400, height: 300 };
  const next = computeResizedWindowRect("se", base, 50, 40, 1920, 1080, 200, 160);
  assert.equal(next.width, 450);
  assert.equal(next.height, 340);
  assert.equal(next.x, 100);
  assert.equal(next.y, 80);
});

test("computeResizedWindowRect — west moves x and shrinks width", () => {
  const base = { x: 100, y: 80, width: 400, height: 300 };
  const next = computeResizedWindowRect("w", base, 50, 0, 1920, 1080, 200, 160);
  assert.equal(next.width, 350);
  assert.equal(next.x, 150);
});

test("computeResizedWindowRect — north moves y and shrinks height", () => {
  const base = { x: 100, y: 80, width: 400, height: 300 };
  const next = computeResizedWindowRect("n", base, 0, 60, 1920, 1080, 200, 160);
  assert.equal(next.height, 240);
  assert.equal(next.y, 140);
});

test("normalizeRect clamps to viewport", () => {
  const next = normalizeRect(
    { x: -10, y: 0, width: 5000, height: 5000 },
    800,
    600,
    200,
    160,
  );
  assert.equal(next.x, 0);
  assert.equal(next.width, 800);
  assert.equal(next.height, 600);
});
