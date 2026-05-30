import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import * as vscode from "vscode";

import {
  BROWSER_USER_FREE_HTTP_PATH_PREFIX,
  BROWSER_USER_MODELS_HTTP_PATH_PREFIX,
  BROWSER_USER_TESAIOT_TEXTURES_HTTP_PATH_PREFIX,
} from "./assetLayout";

let server: http.Server | null = null;
let baseUrl: string | null = null;
let startPromise: Promise<string> | null = null;

/** Read-only files under this directory are served at {@link BROWSER_USER_MODELS_HTTP_PATH_PREFIX}. */
let userModelsRootFs: string | null = null;

/**
 * Extension globalStorage `.../assets/tesaiot/models` (same as model-downloader bridge root).
 * Call on activate; clear on deactivate or when stopping the server.
 */
export function setLocalWebappUserModelsRoot(fsPath: string | null): void {
  const t = fsPath?.trim();
  userModelsRootFs = t && t.length > 0 ? path.resolve(t) : null;
}

/** Read-only files under `.../globalStorage/.../assets/free` at {@link BROWSER_USER_FREE_HTTP_PATH_PREFIX}. */
let freePackRootFs: string | null = null;

export function setLocalWebappFreePackRoot(fsPath: string | null): void {
  const t = fsPath?.trim();
  freePackRootFs = t && t.length > 0 ? path.resolve(t) : null;
}

/** Read-only files under `.../globalStorage/.../assets/tesaiot/textures` at {@link BROWSER_USER_TESAIOT_TEXTURES_HTTP_PATH_PREFIX}. */
let tesaiotTexturesRootFs: string | null = null;

export function setLocalWebappTesaiotTexturesRoot(fsPath: string | null): void {
  const t = fsPath?.trim();
  tesaiotTexturesRootFs = t && t.length > 0 ? path.resolve(t) : null;
}

function mimeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".wasm": "application/wasm",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".bin": "application/octet-stream",
    ".map": "application/json",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * Map request pathname to a file under `root`, or null if unsafe / invalid.
 */
function resolveSafePath(root: string, pathname: string): string | null {
  let raw = pathname.split("?")[0] ?? "/";
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const segments = raw.split("/").filter((s) => s.length > 0);
  for (const seg of segments) {
    if (seg === ".." || seg === ".") {
      return null;
    }
  }
  const relative =
    segments.length > 0 ? path.join(...segments) : path.join("index.html");
  const full = path.resolve(root, relative);
  const rootResolved = path.resolve(root);
  const rel = path.relative(rootResolved, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }
  return full;
}

/**
 * Map `pathname` under an HTTP prefix to a file under `rootFs`, or null.
 */
function resolveFileUnderHttpPrefix(
  rootFs: string | null,
  pathname: string,
  httpPrefix: string,
): string | null {
  if (!rootFs) {
    return null;
  }
  if (!pathname.startsWith(httpPrefix)) {
    return null;
  }
  let rest = pathname.slice(httpPrefix.length).split("?")[0] ?? "";
  try {
    rest = decodeURIComponent(rest);
  } catch {
    return null;
  }
  if (rest.startsWith("/")) {
    rest = rest.slice(1);
  }
  if (!rest || rest.endsWith("/")) {
    return null;
  }
  return resolveSafePath(rootFs, "/" + rest.replace(/\\/g, "/"));
}

function resolveUserModelsFile(pathname: string): string | null {
  return resolveFileUnderHttpPrefix(
    userModelsRootFs,
    pathname,
    BROWSER_USER_MODELS_HTTP_PATH_PREFIX,
  );
}

function resolveUserFreePackFile(pathname: string): string | null {
  return resolveFileUnderHttpPrefix(
    freePackRootFs,
    pathname,
    BROWSER_USER_FREE_HTTP_PATH_PREFIX,
  );
}

function resolveUserTesaiotTexturesFile(pathname: string): string | null {
  return resolveFileUnderHttpPrefix(
    tesaiotTexturesRootFs,
    pathname,
    BROWSER_USER_TESAIOT_TEXTURES_HTTP_PATH_PREFIX,
  );
}

function sendLocalFile(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  filePath: string
): void {
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.statusCode = 404;
      res.end();
      return;
    }
    res.setHeader("Content-Type", mimeFor(filePath));
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  });
}

export function getLocalWebappRoot(extensionPath: string): string {
  return path.join(extensionPath, "out", "webview");
}

/**
 * Start (or reuse) a localhost-only static server for `out/webview`. Returns the origin URL.
 */
export async function ensureLocalWebappServer(
  extensionPath: string,
): Promise<string> {
  if (baseUrl && server?.listening) {
    return baseUrl;
  }
  if (startPromise) {
    return startPromise;
  }

  startPromise = startServerLocked(extensionPath).finally(() => {
    startPromise = null;
  });
  return startPromise;
}

function startServerLocked(extensionPath: string): Promise<string> {
  const root = getLocalWebappRoot(extensionPath);
  const indexFile = path.join(root, "index.html");
  if (!fs.existsSync(indexFile)) {
    return Promise.reject(
      new Error(
        "Bundled web UI not found (out/webview/index.html). Rebuild the extension.",
      ),
    );
  }

  const config = vscode.workspace.getConfiguration("ternion");
  const port = config.get<number>("browserApp.port", 0);
  if (port < 0 || port > 65535) {
    return Promise.reject(
      new Error("Invalid ternion.browserApp.port (must be 0–65535)."),
    );
  }

  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.statusCode = 405;
        res.end();
        return;
      }
      const rawUrl = req.url ?? "/";
      const pathname = rawUrl.split("?")[0] ?? "/";
      if (!pathname.startsWith("/")) {
        res.statusCode = 400;
        res.end();
        return;
      }

      if (pathname.startsWith(BROWSER_USER_MODELS_HTTP_PATH_PREFIX)) {
        const userFile = resolveUserModelsFile(pathname);
        if (!userFile) {
          res.statusCode = userModelsRootFs ? 404 : 503;
          res.end();
          return;
        }
        sendLocalFile(req, res, userFile);
        return;
      }

      if (pathname.startsWith(BROWSER_USER_FREE_HTTP_PATH_PREFIX)) {
        const freeFile = resolveUserFreePackFile(pathname);
        if (!freeFile) {
          res.statusCode = freePackRootFs ? 404 : 503;
          res.end();
          return;
        }
        sendLocalFile(req, res, freeFile);
        return;
      }

      if (pathname.startsWith(BROWSER_USER_TESAIOT_TEXTURES_HTTP_PATH_PREFIX)) {
        const texFile = resolveUserTesaiotTexturesFile(pathname);
        if (!texFile) {
          res.statusCode = tesaiotTexturesRootFs ? 404 : 503;
          res.end();
          return;
        }
        sendLocalFile(req, res, texFile);
        return;
      }

      let filePath = resolveSafePath(root, pathname);
      if (!filePath) {
        res.statusCode = 403;
        res.end();
        return;
      }
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
      sendLocalFile(req, res, filePath);
    });

    srv.on("error", (e) => {
      server = null;
      baseUrl = null;
      reject(e);
    });

    srv.listen(port, "127.0.0.1", () => {
      const addr = srv.address();
      if (!addr || typeof addr === "string") {
        srv.close();
        server = null;
        baseUrl = null;
        reject(new Error("Could not bind local web app server."));
        return;
      }
      server = srv;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve(baseUrl);
    });
  });
}

export function stopLocalWebappServer(): Promise<void> {
  startPromise = null;
  return new Promise((resolve) => {
    if (!server) {
      baseUrl = null;
      resolve();
      return;
    }
    const srv = server;
    server = null;
    baseUrl = null;
    srv.close(() => resolve());
  });
}
