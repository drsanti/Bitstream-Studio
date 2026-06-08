// @ts-nocheck
import react from "@vitejs/plugin-react";
import { resolve, dirname, extname, relative } from "path";
import { existsSync, readFileSync, statSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

import { defineConfig } from "vite";
import { DEV_SRC_ASSET_DIRS } from "./src/assetLayout";
import {
  resolveExtensionGlobalStorageFreePackRoot,
  resolveExtensionGlobalStorageTesaiotModelsRoot,
  resolveExtensionGlobalStorageTesaiotTexturesRoot,
} from "./src/extensionGlobalStoragePaths";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const __dirname = dirname(fileURLToPath(import.meta.url));

const extensionPackageVersion = JSON.parse(
  readFileSync(resolve(__dirname, "package.json"), "utf8"),
).version as string;

// Bundled extension assets (free pack, tesaiot Model Loader samples)
const localAssetsPath = resolve(__dirname, "src/assets");
const freeTexturesPath = resolve(localAssetsPath, ...DEV_SRC_ASSET_DIRS.freeTextures);
const freeModelsPath = resolve(localAssetsPath, ...DEV_SRC_ASSET_DIRS.freeModels);
const tesaiotModelsPath = resolve(localAssetsPath, ...DEV_SRC_ASSET_DIRS.tesaiotModels);
const tesaiotTexturesPath = resolve(localAssetsPath, ...DEV_SRC_ASSET_DIRS.tesaiotTextures);
const localSoundsPath = resolve(localAssetsPath, "sounds");
const localJoltPath = resolve(localAssetsPath, "jolt");
const localVisionMediapipePath = resolve(localAssetsPath, "vision/mediapipe");
const vehiclePhysicsRoot = resolve(
  __dirname,
  "src/webview/simulations/vehicle-physics",
);

/**
 * Vite dev: resolve `rel` (decoded path under HTTP prefix) to a real file for user mirrors.
 * Order: env override → extension globalStorage → repo `src/assets/...`.
 */
function resolveViteDevUserMirrorFile(
  rel: string,
  kind: "tesaiotModels" | "freePack" | "tesaiotTextures",
): string | null {
  const envKey =
    kind === "tesaiotModels"
      ? "TERNION_VITE_USER_MODELS_ROOT"
      : kind === "freePack"
        ? "TERNION_VITE_USER_FREE_ROOT"
        : "TERNION_VITE_USER_TESAIOT_TEXTURES_ROOT";
  const envRoot = process.env[envKey]?.trim();
  const repoFallback =
    kind === "tesaiotModels"
      ? resolve(__dirname, "src", "assets", "tesaiot", "models")
      : kind === "freePack"
        ? resolve(__dirname, "src", "assets", "free")
        : resolve(__dirname, "src", "assets", "tesaiot", "textures");

  const candidates: string[] = [];
  if (envRoot) {
    candidates.push(resolve(envRoot));
  }
  const globalRoot =
    kind === "tesaiotModels"
      ? resolveExtensionGlobalStorageTesaiotModelsRoot()
      : kind === "freePack"
        ? resolveExtensionGlobalStorageFreePackRoot()
        : resolveExtensionGlobalStorageTesaiotTexturesRoot();
  if (globalRoot) {
    candidates.push(globalRoot);
  }
  candidates.push(repoFallback);

  const seen = new Set<string>();
  for (const root of candidates) {
    const norm = root.toLowerCase();
    if (seen.has(norm)) {
      continue;
    }
    seen.add(norm);
    if (!existsSync(root)) {
      continue;
    }
    const filePath = resolve(root, rel);
    if (relative(root, filePath).startsWith("..") || relative(root, filePath) === "") {
      continue;
    }
    if (!existsSync(filePath)) {
      continue;
    }
    try {
      const stats = statSync(filePath);
      if (stats.isFile()) {
        return filePath;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

function sendViteDevStaticFile(
  req: { method?: string },
  res: {
    setHeader: (k: string, v: string | number) => void;
    end: (b?: Buffer) => void;
    statusCode?: number;
  },
  filePath: string,
): void {
  const stats = statSync(filePath);
  const ext = extname(filePath).toLowerCase();
  const contentType =
    ext === ".glb"
      ? "model/gltf-binary"
      : ext === ".gltf"
        ? "model/gltf+json"
        : ext === ".js"
          ? "application/javascript; charset=utf-8"
          : ext === ".wasm"
            ? "application/wasm"
            : ext === ".webp"
          ? "image/webp"
          : ext === ".png"
            ? "image/png"
            : ext === ".jpg" || ext === ".jpeg"
              ? "image/jpeg"
              : ext === ".json"
                ? "application/json; charset=utf-8"
                : "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", stats.size);
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(readFileSync(filePath));
}

/**
 * Serve Jolt WASM glue from `src/assets/jolt` during Vite dev (`/jolt/*`, `/assets/jolt/*`).
 */
const serveJoltAssetsPlugin = () => {
  return {
    name: "serve-jolt-assets",
    configureServer(server) {
      if (!existsSync(localJoltPath)) {
        console.warn(
          "[serveJoltAssetsPlugin] Jolt assets not found, skipping middleware",
        );
        return;
      }

      const serveJoltFile = (
        req,
        res,
        next,
        prefix: string,
      ): boolean => {
        const method = req.method ?? "GET";
        if (method !== "GET" && method !== "HEAD") {
          return false;
        }
        const pathname = (req.url ?? "").split("?")[0] || "";
        if (!pathname.startsWith(prefix)) {
          return false;
        }
        const relativePath =
          decodeURIComponent(pathname.slice(prefix.length)) || "index.js";
        const filePath = resolve(localJoltPath, relativePath);
        if (
          relative(localJoltPath, filePath).startsWith("..") ||
          relative(localJoltPath, filePath) === ""
        ) {
          return false;
        }
        if (!existsSync(filePath)) {
          return false;
        }
        try {
          const stats = statSync(filePath);
          if (!stats.isFile()) {
            return false;
          }
          const content = readFileSync(filePath);
          const ext = extname(filePath).toLowerCase();
          const contentType =
            ext === ".js"
              ? "application/javascript"
              : ext === ".wasm"
                ? "application/wasm"
                : "application/octet-stream";
          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Length", content.length);
          res.end(content);
          return true;
        } catch (error) {
          console.warn(
            `[serveJoltAssetsPlugin] Error serving ${filePath}:`,
            error,
          );
          return false;
        }
      };

      server.middlewares.use((req, res, next) => {
        if (
          serveJoltFile(req, res, next, "/jolt/") ||
          serveJoltFile(req, res, next, "/assets/jolt/")
        ) {
          return;
        }
        next();
      });
    },
  };
};

/**
 * Serve MediaPipe vision assets from `src/assets/vision/mediapipe` during Vite dev
 * at `/assets/vision/mediapipe/*` (matches production `viteStaticCopy` layout).
 */
const serveVisionMediapipeAssetsPlugin = () => {
  return {
    name: "serve-vision-mediapipe-assets",
    configureServer(server) {
      if (!existsSync(localVisionMediapipePath)) {
        console.warn(
          "[serveVisionMediapipeAssetsPlugin] vision/mediapipe not found — run npm run vision:copy-mediapipe",
        );
        return;
      }

      const serveVisionFile = (req, res, prefix: string): boolean => {
        const method = req.method ?? "GET";
        if (method !== "GET" && method !== "HEAD") {
          return false;
        }
        const pathname = (req.url ?? "").split("?")[0] || "";
        if (!pathname.startsWith(prefix)) {
          return false;
        }
        let relativePath = "";
        try {
          relativePath = decodeURIComponent(pathname.slice(prefix.length)) || "";
        } catch {
          return false;
        }
        if (!relativePath || relativePath.includes("\0")) {
          return false;
        }
        const filePath = resolve(localVisionMediapipePath, relativePath);
        if (
          relative(localVisionMediapipePath, filePath).startsWith("..") ||
          relative(localVisionMediapipePath, filePath) === ""
        ) {
          return false;
        }
        if (!existsSync(filePath)) {
          return false;
        }
        try {
          sendViteDevStaticFile(req, res, filePath);
          return true;
        } catch (error) {
          console.warn(
            `[serveVisionMediapipeAssetsPlugin] Error serving ${filePath}:`,
            error,
          );
          return false;
        }
      };

      server.middlewares.use((req, res, next) => {
        if (
          serveVisionFile(req, res, "/assets/vision/mediapipe/") ||
          serveVisionFile(req, res, "/__extension_src_assets/vision/mediapipe/")
        ) {
          return;
        }
        next();
      });
    },
  };
};

/**
 * Serve `extension/src/assets` during dev.
 * Vite root is `src/webview`, so `/assets/...` maps to `src/webview/assets`, not `src/assets`.
 * Model Catalog uses `/__extension_src_assets/...` for GLB under `src/assets/free/models`, `tesaiot/models`, etc.
 *
 * Also serves `/__ternion_user_models|free|tesaiot_textures/` like {@link local-webapp-server.ts} so
 * `bridgeWebPathToCatalogModelUrl` works on `localhost:5173` (globalStorage or optional `TERNION_VITE_*` env).
 */
const serveExtensionLocalAssetsPlugin = () => {
  const extensionSrcAssets = resolve(__dirname, "src/assets");
  return {
    name: "serve-extension-local-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const method = req.method ?? "GET";
        if ((method !== "GET" && method !== "HEAD") || !req.url) {
          return next();
        }
        const pathname = req.url.split("?")[0] || "";

        const tryUserMirror = (
          prefix: string,
          kind: "tesaiotModels" | "freePack" | "tesaiotTextures",
        ): boolean => {
          if (!pathname.startsWith(prefix)) {
            return false;
          }
          let rel = "";
          try {
            rel = decodeURIComponent(pathname.slice(prefix.length));
          } catch {
            return false;
          }
          if (!rel || rel.includes("\0")) {
            return false;
          }
          const filePath = resolveViteDevUserMirrorFile(rel.replace(/\\/g, "/"), kind);
          if (!filePath) {
            return false;
          }
          try {
            sendViteDevStaticFile(req, res, filePath);
            return true;
          } catch (error) {
            console.warn(
              "[serveExtensionLocalAssetsPlugin] user mirror file error:",
              error,
            );
            return false;
          }
        };

        if (
          tryUserMirror("/__ternion_user_models/", "tesaiotModels") ||
          tryUserMirror("/__ternion_user_free/", "freePack") ||
          tryUserMirror("/__ternion_user_tesaiot_textures/", "tesaiotTextures")
        ) {
          return;
        }

        let root = null;
        let prefixLen = 0;
        if (pathname.startsWith("/__extension_src_assets/")) {
          root = extensionSrcAssets;
          prefixLen = "/__extension_src_assets/".length;
        } else {
          return next();
        }
        let rel = "";
        try {
          rel = decodeURIComponent(pathname.slice(prefixLen));
        } catch {
          return next();
        }
        if (!rel || rel.includes("\0")) {
          return next();
        }
        const filePath = resolve(root, rel);
        if (relative(root, filePath).startsWith("..") || relative(root, filePath) === "") {
          return next();
        }
        if (!existsSync(filePath)) {
          return next();
        }
        try {
          const stats = statSync(filePath);
          if (!stats.isFile()) {
            return next();
          }
          const content = readFileSync(filePath);
          const ext = extname(filePath).toLowerCase();
          const contentType =
            ext === ".glb"
              ? "model/gltf-binary"
              : ext === ".gltf"
                ? "model/gltf+json"
                : ext === ".webp"
                  ? "image/webp"
                  :             ext === ".png"
                    ? "image/png"
                    : ext === ".jpg" || ext === ".jpeg"
                      ? "image/jpeg"
                      : "application/octet-stream";
          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Length", content.length);
          res.end(content);
        } catch (error) {
          console.warn(
            "[serveExtensionLocalAssetsPlugin] Error serving file:",
            error,
          );
          next();
        }
      });
    },
  };
};

function readHttpJsonBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolveBody(text.length > 0 ? JSON.parse(text) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendDevApiJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

/**
 * Dev-only: write official flow preset overrides into the repo from the webview.
 * POST /__dev_api/flow-preset/apply-override — { templateId, content }
 * POST /__dev_api/flow-preset/commit-override — write + regen + stage + optional publish
 * POST /__dev_api/flow-preset/finalize-overrides — regen + stage + optional publish
 * POST /__dev_api/flow-preset/regen — runs flow-preset:gen
 * GET  /__dev_api/flow-preset/publish-status
 * POST /__dev_api/flow-preset/stage-free-pack
 * POST /__dev_api/flow-preset/publish-free-pack
 * POST /__dev_api/flow-preset/prepare-publish — { publishOnline?: boolean }
 */
const flowPresetOverrideDevApiPlugin = () => ({
  name: "flow-preset-override-dev-api",
  configureServer(server) {
    const runFlowPresetGen = () => {
      const result = spawnSync("npx", ["tsx", "scripts/generate-official-flow-presets.ts"], {
        cwd: __dirname,
        encoding: "utf8",
        shell: process.platform === "win32",
      });
      if (result.status !== 0) {
        return {
          ok: false,
          error: (result.stderr || result.stdout || "flow-preset:gen failed").trim(),
        };
      }
      return { ok: true };
    };

    const runFlowPresetPublishPipeline = async (publishOnline: boolean) => {
      const regen = runFlowPresetGen();
      if (!regen.ok) {
        return { ok: false as const, step: "regen", error: regen.error };
      }

      const { stageFlowPresetsFreePack, publishFlowPresetsFreePack } = await import(
        "./scripts/flow-preset-publish-io.mjs"
      );

      const staged = stageFlowPresetsFreePack(__dirname);
      if (!staged.ok) {
        return { ok: false as const, step: "stage", error: staged.error };
      }

      if (publishOnline) {
        const published = await publishFlowPresetsFreePack(__dirname);
        if (!published.ok) {
          return {
            ok: false as const,
            step: "publish",
            staged,
            error: published.error,
          };
        }
        return { ok: true as const, regen: true as const, staged, published };
      }

      return { ok: true as const, regen: true as const, staged };
    };

    server.middlewares.use(async (req, res, next) => {
      if (!req.url) {
        return next();
      }
      const pathname = req.url.split("?")[0] || "";
      const method = req.method ?? "GET";

      if (method === "GET" && pathname === "/__dev_api/flow-preset/publish-status") {
        try {
          const { getFlowPresetPublishStatus } = await import(
            "./scripts/flow-preset-publish-io.mjs"
          );
          sendDevApiJson(res, 200, { ok: true, ...getFlowPresetPublishStatus(__dirname) });
        } catch (error) {
          sendDevApiJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (method !== "POST") {
        return next();
      }

      if (pathname === "/__dev_api/flow-preset/apply-override") {
        try {
          const body = await readHttpJsonBody(req);
          const templateId = String(body.templateId ?? "").trim();
          const content = String(body.content ?? "");
          if (templateId.length === 0 || content.length === 0) {
            sendDevApiJson(res, 400, {
              ok: false,
              error: "templateId and content are required",
            });
            return;
          }
          const parsed = JSON.parse(content);
          const {
            validateFlowPresetOverridePayload,
            resolveFlowPresetOverrideDest,
            writeFlowPresetOverrideFile,
          } = await import("./scripts/flow-preset-override-io.mjs");
          const validation = validateFlowPresetOverridePayload(templateId, parsed);
          if (!validation.ok) {
            sendDevApiJson(res, 400, { ok: false, error: validation.error });
            return;
          }
          const destPath = resolveFlowPresetOverrideDest(__dirname, templateId);
          writeFlowPresetOverrideFile(destPath, content);
          const relPath = relative(__dirname, destPath).replace(/\\/g, "/");
          sendDevApiJson(res, 200, {
            ok: true,
            path: relPath,
            warning: validation.warning,
          });
        } catch (error) {
          sendDevApiJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (pathname === "/__dev_api/flow-preset/commit-override") {
        try {
          const body = await readHttpJsonBody(req);
          const templateId = String(body.templateId ?? "").trim();
          const content = String(body.content ?? "");
          const publishOnline = body.publishOnline === true;
          if (templateId.length === 0 || content.length === 0) {
            sendDevApiJson(res, 400, {
              ok: false,
              error: "templateId and content are required",
            });
            return;
          }
          const parsed = JSON.parse(content);
          const {
            validateFlowPresetOverridePayload,
            resolveFlowPresetOverrideDest,
            writeFlowPresetOverrideFile,
          } = await import("./scripts/flow-preset-override-io.mjs");
          const validation = validateFlowPresetOverridePayload(templateId, parsed);
          if (!validation.ok) {
            sendDevApiJson(res, 400, { ok: false, error: validation.error });
            return;
          }
          const destPath = resolveFlowPresetOverrideDest(__dirname, templateId);
          writeFlowPresetOverrideFile(destPath, content);
          const relPath = relative(__dirname, destPath).replace(/\\/g, "/");

          const pipeline = await runFlowPresetPublishPipeline(publishOnline);
          if (!pipeline.ok) {
            sendDevApiJson(res, pipeline.step === "regen" ? 500 : 400, {
              ok: false,
              step: pipeline.step,
              path: relPath,
              warning: validation.warning,
              error: pipeline.error,
            });
            return;
          }

          sendDevApiJson(res, 200, {
            ok: true,
            path: relPath,
            warning: validation.warning,
            ...pipeline,
          });
        } catch (error) {
          sendDevApiJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (pathname === "/__dev_api/flow-preset/finalize-overrides") {
        try {
          const body = await readHttpJsonBody(req);
          const publishOnline = body.publishOnline === true;
          const pipeline = await runFlowPresetPublishPipeline(publishOnline);
          if (!pipeline.ok) {
            sendDevApiJson(res, pipeline.step === "regen" ? 500 : 400, {
              ok: false,
              step: pipeline.step,
              error: pipeline.error,
            });
            return;
          }
          sendDevApiJson(res, 200, { ok: true, path: "", ...pipeline });
        } catch (error) {
          sendDevApiJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (pathname === "/__dev_api/flow-preset/regen") {
        try {
          const result = runFlowPresetGen();
          if (!result.ok) {
            sendDevApiJson(res, 500, result);
            return;
          }
          sendDevApiJson(res, 200, { ok: true });
        } catch (error) {
          sendDevApiJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (pathname === "/__dev_api/flow-preset/stage-free-pack") {
        try {
          const { stageFlowPresetsFreePack } = await import(
            "./scripts/flow-preset-publish-io.mjs"
          );
          const result = stageFlowPresetsFreePack(__dirname);
          sendDevApiJson(res, result.ok ? 200 : 400, result);
        } catch (error) {
          sendDevApiJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (pathname === "/__dev_api/flow-preset/publish-free-pack") {
        try {
          const { publishFlowPresetsFreePack } = await import(
            "./scripts/flow-preset-publish-io.mjs"
          );
          const result = await publishFlowPresetsFreePack(__dirname);
          sendDevApiJson(res, result.ok ? 200 : 400, result);
        } catch (error) {
          sendDevApiJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (pathname === "/__dev_api/flow-preset/prepare-publish") {
        try {
          const body = await readHttpJsonBody(req);
          const publishOnline = body.publishOnline === true;
          const pipeline = await runFlowPresetPublishPipeline(publishOnline);
          if (!pipeline.ok) {
            sendDevApiJson(res, pipeline.step === "regen" ? 500 : 400, {
              ok: false,
              step: pipeline.step,
              error: pipeline.error,
            });
            return;
          }
          sendDevApiJson(res, 200, { ok: true, ...pipeline });
        } catch (error) {
          sendDevApiJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      return next();
    });
  },
});

// Plugin to suppress CSS variable warnings during build
const suppressCSSWarningsPlugin = () => {
  let originalWarn: typeof console.warn;
  let originalError: typeof console.error;
  let originalLog: typeof console.log;

  const shouldSuppress = (message: string): boolean => {
    return (
      (message.includes("Found") &&
        message.includes("warning while optimizing generated CSS")) ||
      message.includes("Unexpected token BadUrl") ||
      message.includes("var(--bg-image-url") ||
      message.includes("BadUrl(") ||
      message.includes("^-- Unexpected token")
    );
  };

  return {
    name: "suppress-css-warnings",
    buildStart() {
      // Intercept console methods during build to filter CSS warnings
      originalWarn = console.warn;
      originalError = console.error;
      originalLog = console.log;

      console.warn = (...args: any[]) => {
        const message = String(args[0] || "");
        if (shouldSuppress(message)) {
          return; // Suppress this warning
        }
        originalWarn.apply(console, args);
      };

      console.error = (...args: any[]) => {
        const message = String(args[0] || "");
        if (shouldSuppress(message)) {
          return; // Suppress this error
        }
        originalError.apply(console, args);
      };

      // Also intercept console.log in case warnings are logged there
      console.log = (...args: any[]) => {
        const message = String(args[0] || "");
        if (shouldSuppress(message)) {
          return; // Suppress this log
        }
        originalLog.apply(console, args);
      };
    },
    buildEnd() {
      // Restore original console methods
      if (originalWarn) console.warn = originalWarn;
      if (originalError) console.error = originalError;
      if (originalLog) console.log = originalLog;
    },
  };
};

export default defineConfig({
  root: resolve(__dirname, "src/webview"),
  // VS Code webview resources are served from an asWebviewUri base; absolute `/assets/...`
  // can resolve outside that base and return 401. Keep emitted asset URLs relative.
  base: "./",
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"], // must run first!
      },
    }),
    tailwindcss(),
    serveJoltAssetsPlugin(),
    serveVisionMediapipeAssetsPlugin(),
    serveExtensionLocalAssetsPlugin(), // src/assets for Model Catalog (browser dev)
    flowPresetOverrideDevApiPlugin(),
    suppressCSSWarningsPlugin(), // Suppress CSS warnings during build
    viteStaticCopy({
      targets: [
        ...(existsSync(freeTexturesPath)
          ? [
              {
                src: "../assets/free/textures/cubemap/**/*",
                dest: "./assets/free/textures/cubemap",
              },
            ]
          : []),
        ...(existsSync(freeModelsPath)
          ? [
              {
                src: "../assets/free/models",
                dest: "./assets/models",
              },
            ]
          : []),
        ...(existsSync(tesaiotModelsPath)
          ? [
              {
                src: "../assets/tesaiot/models",
                dest: "./assets/tesaiot/models",
              },
            ]
          : []),
        ...(existsSync(tesaiotTexturesPath)
          ? [
              {
                src: "../assets/tesaiot/textures",
                dest: "./assets/tesaiot/textures",
              },
            ]
          : []),
        ...(existsSync(localSoundsPath)
          ? [
              {
                src: "../assets/sounds/**/*",
                dest: "./assets/sounds",
              },
            ]
            : []),
        ...(existsSync(localJoltPath)
          ? [
              {
                src: "../assets/jolt/**/*",
                dest: "./jolt",
              },
              {
                src: "../assets/jolt",
                dest: "./assets",
              },
            ]
          : []),
        {
          src: "../assets/vision/**/*",
          dest: "./assets/vision",
        },
        {
          src: "../assets/libraries/flow-preset/**/*",
          dest: "./assets/libraries/flow-preset",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/webview"),
      "@assets": resolve(__dirname, "src/assets"),
      "@vehicle-jolt": resolve(vehiclePhysicsRoot, "physics/jolt"),
      "@vehicle-engine": resolve(
        vehiclePhysicsRoot,
        "physics/VehicleSimulationEngine.ts",
      ),
      "@vehicle-host": resolve(
        vehiclePhysicsRoot,
        "physics/VehiclePhysicsHost.ts",
      ),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@xyflow/react",
      // Dedupe peer dependencies to ensure they're resolved from extension's node_modules
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "@radix-ui/react-context-menu",
      "@react-three/drei",
      "@react-three/fiber",
      "@react-three/rapier",
      "chroma-js",
      "class-variance-authority",
      "clsx",
      "gsap",
      "lucide-react",
      "mqtt",
      "tailwind-merge",
      "three",
      "three-nebula",
      "uuid",
      "zustand",
    ],
  },
  define: {
    "import.meta.env.VITE_BITSTREAM_STUDIO_VERSION": JSON.stringify(extensionPackageVersion),
    "import.meta.env.VITE_MQTT_BROKER_URL": JSON.stringify(
      process.env.VITE_MQTT_BROKER_URL || "ws://localhost:8083",
    ),
  },
  server: {
    port: 5173,
    /** Default dev entry — toolbar tabs switch workspace (no `?app=`). */
    open: process.env.VITE_DEV_OPEN ?? "/",
    cors: true,
    fs: {
      // Allow serving files from node_modules
      allow: [
        resolve(__dirname, "src/webview"),
        resolve(__dirname, "src/assets"),
        resolve(__dirname, ".."),
        resolve(__dirname, "node_modules"),
      ],
    },
    headers: {
      // Prevent caching of source files to ensure alias resolution always runs
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  },
  logLevel: "warn", // Reduce log verbosity - only show warnings and errors
  clearScreen: false, // Don't clear screen on restart to preserve output
  customLogger: {
    // Suppress specific warnings in dev mode
    warn: (msg, options) => {
      // Suppress dynamic import warnings from minified library code
      if (
        typeof msg === "string" &&
        (msg.includes("dynamic import cannot be analyzed by Vite") ||
          msg.includes("The above dynamic import cannot be analyzed"))
      ) {
        return;
      }
      // Suppress CSS variable warnings (valid CSS, just optimizer doesn't understand)
      if (
        typeof msg === "string" &&
        (msg.includes("Unexpected token BadUrl") ||
          msg.includes("var(--bg-image-url"))
      ) {
        return;
      }
      // Use default warning handler for other warnings
      console.warn(msg);
    },
    error: (msg, options) => {
      console.error(msg);
    },
    info: () => {
      // Suppress info messages in dev mode
    },
    clearScreen: () => {
      // Don't clear screen
    },
  },
  build: {
    // Set target to esnext to support top-level await
    target: "esnext",
    chunkSizeWarningLimit: 2000, // 3D stack (Three.js, Rapier) produces large chunks
    outDir: resolve(__dirname, "out/webview"),
    cssCodeSplit: true,
    rollupOptions: {
      input: resolve(__dirname, "src/webview/index.html"),
      output: {
        entryFileNames: "index.js",
        // Use ES module format to support top-level await
        // This matches the type="module" in index.html
        format: "es",
        manualChunks(id) {
          if (
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react/") ||
            id.endsWith("node_modules/react/index.js") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "vendor-react";
          }
          if (
            id.includes("node_modules/@react-three/fiber") ||
            id.includes("node_modules/@react-three/drei") ||
            id.includes("node_modules/three/")
          ) {
            return "vendor-r3f";
          }
          if (id.includes("node_modules/@dimforge/rapier3d-compat")) {
            return "vendor-rapier";
          }
        },
        // Custom asset naming: CSS at root, other assets in subfolder
        // This ensures VS Code webview can load index.css from expected path
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0] === "index.css") {
            return "[name].[ext]"; // out/webview/index.css
          }
          return "assets/[name].[ext]"; // out/webview/assets/*
        },
      },
      // Suppress harmless warnings about Node.js modules being externalized
      onwarn(warning, warn) {
        if (
          warning.code === "MODULE_LEVEL_DIRECTIVE" ||
          (warning.message &&
            (warning.message.includes("has been externalized") ||
              warning.message.includes(
                "externalized for browser compatibility",
              )))
        ) {
          return;
        }
        // Suppress warnings about @__PURE__ comments in external dependencies
        if (
          warning.message &&
          warning.message.includes("@__PURE__") &&
          warning.message.includes(
            "contains an annotation that Rollup cannot interpret",
          )
        ) {
          return;
        }
        // Suppress CSS variable warnings (CSS variables in url() are valid)
        if (
          warning.message &&
          (warning.message.includes("Unexpected token BadUrl") ||
            warning.message.includes("var(--bg-image-url") ||
            warning.message.includes("BadUrl(") ||
            (warning.code === "css-syntax-error" &&
              warning.message.includes("url(")))
        ) {
          return;
        }
        // Suppress dynamic import warnings from minified library code
        if (
          warning.message &&
          warning.message.includes("dynamic import cannot be analyzed by Vite")
        ) {
          return;
        }
        warn(warning);
      },
    },
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
