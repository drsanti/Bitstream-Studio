const fs = require("fs/promises");
const path = require("path");

function stripTailwindImport(cssText) {
  const lines = cssText.split(/\r?\n/);
  const out = [];
  let stripped = false;
  for (const line of lines) {
    if (!stripped && line.trim() === "@import 'tailwindcss';") {
      stripped = true;
      continue;
    }
    out.push(line);
  }
  return out.join("\n").trimStart();
}

function rewriteT3DAssetUrlsForWebview(cssText) {
  // T3D browser app can rely on absolute `/assets/...` when served at domain root.
  // VS Code webview uses `.../out/webview/` so absolute URLs break.
  return cssText.replaceAll("url('/assets/", "url('assets/");
}

function stripT3DBodyBackgroundImage(cssText) {
  // The T3D browser app uses a `body::before` background image that isn't shipped
  // with the extension webview bundle. Keep the rest of the design tokens/styles.
  return cssText.replace(
    /body::before\s*\{[\s\S]*?\}\s*/g,
    ""
  );
}

async function main() {
  const extensionRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(extensionRoot, "..");
  const t3dSrcCss = path.join(repoRoot, "T3D", "src", "index.css");
  const outCss = path.join(extensionRoot, "src", "webview", "t3d-shared.css");

  const src = await fs.readFile(t3dSrcCss, "utf8");
  let next = stripTailwindImport(src);
  next = rewriteT3DAssetUrlsForWebview(next);
  next = stripT3DBodyBackgroundImage(next);

  await fs.mkdir(path.dirname(outCss), { recursive: true });
  await fs.writeFile(outCss, next, "utf8");
}

main().catch((error) => {
  console.error("[sync-t3d-css] Failed to sync T3D CSS:", error);
  process.exit(1);
});

