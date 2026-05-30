#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const webviewRoot = path.join(projectRoot, "src", "webview");

const allowedFiles = new Set([
  path.join("src", "webview", "ui", "components", "common", "GlassButton.tsx"),
  path.join("src", "webview", "ui", "components", "common", "GlassIconButton.tsx"),
  path.join("src", "webview", "ui", "components", "common", "index.ts"),
  path.join("src", "webview", "ui", "components", "index.ts"),
  path.join("src", "webview", "ui", "TRN", "TRNGlassButton.tsx"),
]);

const importMatchers = [
  /from\s+["'][^"']*\/common\/GlassButton(?:\.js)?["']/,
  /from\s+["'][^"']*\/ui\/components(?:\/index)?(?:\.js)?["'][^\n]*\bGlassButton\b/,
];

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, out);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      continue;
    }
    out.push(abs);
  }
}

const files = [];
walk(webviewRoot, files);

const violations = [];
for (const fileAbs of files) {
  const rel = path.relative(projectRoot, fileAbs);
  if (allowedFiles.has(rel)) {
    continue;
  }
  const content = fs.readFileSync(fileAbs, "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    const hasViolation = importMatchers.some((matcher) => matcher.test(line));
    if (hasViolation && /\bGlassButton\b/.test(line)) {
      violations.push(`${rel}:${index + 1}`);
    }
  });
}

if (violations.length > 0) {
  console.error("Legacy GlassButton import guard failed.\n");
  console.error("Use `TRNGlassButton` from `@/ui/TRN` (or relative TRN path) instead.\n");
  for (const item of violations) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log("Legacy GlassButton import guard passed.");
