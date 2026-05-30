/**
 * ESM default export for the `crossoriginworker` package.
 *
 * The npm package is CommonJS-only (`module.exports = fn`). Vite serves it as raw JS,
 * so `import x from "crossoriginworker"` fails in the browser ("does not provide default").
 * This module mirrors the implementation with a proper `export default`.
 *
 * @see https://github.com/CezaryDanielNowak/CrossOriginWorker
 */
const type = "application/javascript";

export default function getCrossOriginWorkerURL(
  originalWorkerUrl: string,
  _options: Record<string, unknown> = {},
): Promise<string> {
  const options = {
    skipSameOrigin: true,
    useBlob: true,
    ..._options,
  };

  if (
    !originalWorkerUrl.includes("://") ||
    originalWorkerUrl.includes(window.location.origin)
  ) {
    return Promise.resolve(originalWorkerUrl);
  }

  return new Promise((resolve, reject) =>
    fetch(originalWorkerUrl)
      .then((res) => res.text())
      .then((codeString) => {
        const workerPath = new URL(originalWorkerUrl).href.split("/");
        workerPath.pop();

        const importScriptsFix = `const _importScripts = importScripts;
const _fixImports = (url) => new URL(url, '${workerPath.join("/") + "/"}').href;
importScripts = (...urls) => _importScripts(...urls.map(_fixImports));`;

        let finalURL =
          `data:${type},` + encodeURIComponent(importScriptsFix + codeString);

        if (options.useBlob) {
          finalURL = URL.createObjectURL(
            new Blob([`importScripts("${finalURL}")`], { type }),
          );
        }

        resolve(finalURL);
      })
      .catch(reject),
  );
}
