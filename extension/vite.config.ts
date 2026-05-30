// @ts-nocheck
import react from "@vitejs/plugin-react";
import { resolve, dirname, extname, relative } from "path";
import {
  existsSync,
  readFileSync,
  statSync,
  realpathSync,
  lstatSync,
} from "fs";
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

// Determine COI worker source path (supports both npm link and installed package)
// vite-static-copy resolves paths relative to root (src/webview)
// IMPORTANT: `vite.config.ts` lives in `t3d-extension/`, so node_modules is `./node_modules`
const packagePath = resolve(__dirname, "./node_modules/@ternion/t3d");
const t3dLocalPath = resolve(__dirname, "../T3D");
const t3dDistIndex = "dist/index.es.js";

const normalizePathForCompare = (p: string) => p.replace(/\\/g, "/").toLowerCase();

const pathPointsAtLocalT3d = (resolvedPath: string) => {
  const normalized = normalizePathForCompare(resolvedPath);
  const local = normalizePathForCompare(t3dLocalPath);
  return normalized === local || normalized.startsWith(`${local}/`);
};

const t3dDistIsReady = (root: string) =>
  existsSync(resolve(root, t3dDistIndex));

/** Resolved T3D package root with built `dist/` (node_modules, symlink, or monorepo `../T3D`). */
const resolveActualT3dPackageRoot = (): string => {
  if (existsSync(packagePath)) {
    try {
      const stats = lstatSync(packagePath);
      const candidate = stats.isSymbolicLink()
        ? realpathSync(packagePath)
        : packagePath;
      if (t3dDistIsReady(candidate)) {
        return candidate;
      }
    } catch {
      // Fall through to local monorepo path
    }
  }

  if (t3dDistIsReady(t3dLocalPath)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[vite] @ternion/t3d is missing or not built in node_modules; using ${t3dLocalPath}. Run "npm install" in t3d-extension and "npm run build:lib:dev" in T3D.`,
      );
    }
    return t3dLocalPath;
  }

  return packagePath;
};

const actualT3dPackageRoot = resolveActualT3dPackageRoot();

const getCoiWorkerPath = () =>
  resolve(actualT3dPackageRoot, "dist/t3d-coi-serviceworker.js");

const isPackageLinked = () => {
  try {
    if (!existsSync(packagePath)) return false;
    const stats = lstatSync(packagePath);
    if (!stats.isSymbolicLink()) return false;
    return pathPointsAtLocalT3d(realpathSync(packagePath));
  } catch {
    return false;
  }
};

const coiWorkerPath = getCoiWorkerPath();

// Subpath aliases must be declared before `@ternion/t3d` (Vite prefix matching).
const t3dResolveAliases = t3dDistIsReady(actualT3dPackageRoot)
  ? {
      "@ternion/t3d/vscode-webview": resolve(
        actualT3dPackageRoot,
        "dist/vscode-webview.es.js",
      ),
      "@ternion/t3d/mqtt-client": resolve(
        actualT3dPackageRoot,
        "dist/mqtt-client.es.js",
      ),
      "@ternion/t3d/ui": resolve(actualT3dPackageRoot, "dist/ui.es.js"),
      "@ternion/t3d": resolve(actualT3dPackageRoot, "dist/index.es.js"),
    }
  : {};

/**
 * Dev server: `T3DJoltLoader` registers `/t3d-coi-serviceworker.js` (see T3DJoltLoaderConfig).
 * Vite only mirrors `public/` at the root; we copy the COI script at build time but not into `public/`.
 * Serve the same file from `@ternion/t3d` during `vite` so COI + multithreaded Jolt work in the browser.
 */
const serveCoiServiceWorkerPlugin = () => ({
  name: "serve-t3d-coi-serviceworker",
  configureServer(server: { middlewares: { use: (fn: unknown) => void } }) {
    server.middlewares.use(
      (
        req: { method?: string; url?: string },
        res: {
          setHeader: (k: string, v: string) => void;
          end: (b: Buffer) => void;
        },
        next: () => void,
      ) => {
        if (req.method !== "GET" || !req.url) {
          return next();
        }
        const pathname = (req.url.split("?")[0] || "").replace(/\/$/, "") || "/";
        if (pathname !== "/t3d-coi-serviceworker.js") {
          return next();
        }
        if (!existsSync(coiWorkerPath)) {
          console.warn(
            `[serve-t3d-coi-serviceworker] Missing file: ${coiWorkerPath}`,
          );
          return next();
        }
        try {
          const content = readFileSync(coiWorkerPath);
          res.setHeader("Content-Type", "application/javascript; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(content);
        } catch (error) {
          console.warn("[serve-t3d-coi-serviceworker] Read failed:", error);
          next();
        }
      },
    );
  },
});

// Optional repo-level assets (parent of t3d-extension); used for Jolt fallback only.
const projectRootAssetsPath = resolve(__dirname, "../assets");
const joltPath = resolve(projectRootAssetsPath, "jolt");

// Bundled extension assets under `t3d-extension/src/assets` (free pack, tesaiot Model Loader samples)
const localAssetsPath = resolve(__dirname, "src/assets");
const localJoltPath = resolve(localAssetsPath, "jolt");
const freeTexturesPath = resolve(localAssetsPath, ...DEV_SRC_ASSET_DIRS.freeTextures);
const freeModelsPath = resolve(localAssetsPath, ...DEV_SRC_ASSET_DIRS.freeModels);
const tesaiotModelsPath = resolve(localAssetsPath, ...DEV_SRC_ASSET_DIRS.tesaiotModels);
const tesaiotTexturesPath = resolve(localAssetsPath, ...DEV_SRC_ASSET_DIRS.tesaiotTextures);
const localSoundsPath = resolve(localAssetsPath, "sounds");
const project4CubemapTexturesPath = resolve(localAssetsPath, "textures/cubemap");
const project4RobotModelPath = resolve(
  localAssetsPath,
  "models",
  "robot-4th-project",
);

// Custom plugin to resolve @ternion/t3d package exports
// Supports npm package, file: dependency, and npm link modes.
// In dev server, prefer T3D source files when available for faster iteration.
const t3dPackageResolverPlugin = () => {
  const actualPackagePath = actualT3dPackageRoot;
  const isLinked = isPackageLinked();

  if (isLinked && process.env.NODE_ENV !== "production") {
    console.log(
      `[t3d-package-resolver] Detected npm link mode -> ${actualPackagePath}`,
    );
  }

  // Helper to resolve file paths from npm package or linked package
  const resolveFilePath = (relativePath: string): string | null => {
    const filePath = resolve(actualPackagePath, relativePath);
    if (existsSync(filePath)) {
      return filePath;
    }
    return null;
  };

  // NOTE:
  // T3D source currently uses extensive internal "@/..." aliases and decorator syntax
  // that are not fully compatible with extension webview Vite import-analysis/dev scan.
  // Keep dist-first resolution for reliability in both dev/build.
  const useSourceInDev = false;

  // Map subpath exports to dist files (safe default for compile/package).
  const subpathExportsDist: Record<string, string> = {
    "vscode-webview": "dist/vscode-webview.es.js",
    ui: "dist/ui.es.js",
    "mqtt-client": "dist/mqtt-client.es.js",
  };
  // Source entry points (used in dev when available).
  const subpathExportsSource: Record<string, string> = {
    "vscode-webview": "src/T3D/vscode-webview/index.ts",
    ui: "src/T3D/ui/components/index.ts",
    "mqtt-client": "src/T3D/mqtt-client/index.ts",
  };

  return {
    name: "t3d-package-resolver",
    enforce: "pre",
    resolveId(id) {
      if (!id.startsWith("@ternion/t3d")) {
        return null;
      }

      let resolvedPath: string | null = null;

      // Main export: prefer source in dev, fallback to dist.
      if (id === "@ternion/t3d") {
        if (useSourceInDev) {
          resolvedPath = resolveFilePath("src/T3D/index.ts");
        }
        resolvedPath ??= resolveFilePath("dist/index.es.js");
      }
      // Subpath exports: @ternion/t3d/vscode-webview, etc.
      else if (id.startsWith("@ternion/t3d/")) {
        const subpath = id.replace("@ternion/t3d/", "");
        if (useSourceInDev) {
          const sourceFile = subpathExportsSource[subpath];
          if (sourceFile) {
            resolvedPath = resolveFilePath(sourceFile);
          }
        }
        if (!resolvedPath) {
          const distFile = subpathExportsDist[subpath];
          if (distFile) {
            resolvedPath = resolveFilePath(distFile);
          }
        }
      }

      if (resolvedPath) {
        // Log in development to help debug
        if (process.env.NODE_ENV !== "production") {
          console.log(
            `[t3d-package-resolver] Resolved ${id} -> ${resolvedPath}`,
          );
        }
        return resolvedPath;
      }

      // Log failure in development
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[t3d-package-resolver] Failed to resolve ${id} from ${packagePath}`,
        );
      }

      return null;
    },
  };
};

// Custom plugin to resolve T3D path aliases in source files.
// Handles @/ aliases used inside T3D source (both linked/file and node_modules layouts).
const t3dAliasPlugin = () => {
  const t3dPackagePath = resolve(__dirname, "./node_modules/@ternion/t3d");
  const t3dLocalPathNormalized = t3dLocalPath.replace(/\\/g, "/").toLowerCase();
  const t3dLocalSrcPath = resolve(t3dLocalPath, "src/T3D");
  const t3dPackageSrcPath = resolve(t3dPackagePath, "src/T3D");

  const resolveFromT3DRoot = (
    t3dSrcRoot: string,
    pathWithoutAlias: string,
  ): string | null => {
    const normalized = pathWithoutAlias.replace(/\\/g, "/");
    const candidates = [
      // direct file imports
      resolve(t3dSrcRoot, normalized),
      resolve(t3dSrcRoot, `${normalized}.ts`),
      resolve(t3dSrcRoot, `${normalized}.tsx`),
      resolve(t3dSrcRoot, `${normalized}.js`),
      resolve(t3dSrcRoot, `${normalized}.mjs`),
      // folder imports
      resolve(t3dSrcRoot, normalized, "index.ts"),
      resolve(t3dSrcRoot, normalized, "index.tsx"),
      resolve(t3dSrcRoot, normalized, "index.js"),
      resolve(t3dSrcRoot, normalized, "index.mjs"),
    ];
    for (const p of candidates) {
      if (existsSync(p)) return p.replace(/\\/g, "/");
    }
    return null;
  };

  return {
    name: "t3d-alias-resolver",
    enforce: "pre", // Run before other resolve plugins
    resolveId(id, importer) {
      // Only process imports that use @/ aliases
      if (!id.startsWith("@/")) {
        return null;
      }

      // Remove the @/ prefix and resolve relative to T3D source root.
      const pathWithoutAlias = id.substring(2); // Remove '@/'
      // Resolve against local T3D source first (file:../T3D dev flow).
      const localResolved = resolveFromT3DRoot(t3dLocalSrcPath, pathWithoutAlias);
      if (localResolved) {
        return localResolved;
      }
      // Fallback to package source layout under node_modules.
      const packageResolved = resolveFromT3DRoot(
        t3dPackageSrcPath,
        pathWithoutAlias,
      );
      if (packageResolved) {
        return packageResolved;
      }
      // If unresolved in T3D roots, let Vite's normal aliases (extension "@/") handle it.
      return null;
    },
  };
};

// Custom plugin to skip jolt-physics files from being processed
// Both multithreaded and single-threaded versions should be external
// They are dynamically imported at runtime and resolved via importmap
const skipJoltPhysicsPlugin = () => {
  return {
    name: "skip-jolt-physics",
    resolveId(id) {
      // Skip processing all jolt-physics entry points
      // They are dynamically imported at runtime and should not be bundled
      if (
        id === "jolt-physics/wasm-compat-multithread" ||
        id === "jolt-physics/debug-wasm-compat-multithread" ||
        id === "jolt-physics/wasm-compat" ||
        id === "jolt-physics/debug-wasm-compat" ||
        id.includes("jolt-physics/dist/jolt-physics.multithread.wasm-compat") ||
        id.includes(
          "jolt-physics/dist/jolt-physics.debug.multithread.wasm-compat",
        ) ||
        id.includes("jolt-physics/dist/jolt-physics.wasm-compat") ||
        id.includes("jolt-physics/dist/jolt-physics.debug.wasm-compat")
      ) {
        // Return the id as-is, marking it as external
        return { id, external: true };
      }
      return null;
    },
  };
};

// Custom plugin to serve Jolt assets during development
// viteStaticCopy only copies during build, so we need to serve from source in dev
const serveJoltAssetsPlugin = () => {
  return {
    name: "serve-jolt-assets",
    configureServer(server) {
      // Determine the actual Jolt assets path
      const actualJoltPath = existsSync(localJoltPath)
        ? localJoltPath
        : existsSync(joltPath)
          ? joltPath
          : null;

      if (!actualJoltPath) {
        console.warn(
          "[serveJoltAssetsPlugin] Jolt assets not found, skipping middleware",
        );
        return;
      }

      // Middleware to serve Jolt assets from source directory
      // Only match paths that start with /jolt/ (not /jolt-physics or /jolt-anything)
      server.middlewares.use((req, res, next) => {
        // Only handle GET requests
        if (req.method !== "GET") {
          return next();
        }

        const requestedPath = req.url || "/";
        // Only handle paths that start with /jolt/ (not /jolt-)
        if (!requestedPath.startsWith("/jolt/")) {
          return next();
        }

        // Remove leading /jolt/ to get the relative path within jolt directory
        const relativePath =
          requestedPath.replace(/^\/jolt\//, "") || "index.js";
        const filePath = resolve(actualJoltPath, relativePath);

        // Check if file exists
        if (existsSync(filePath)) {
          // Serve the file
          try {
            const stats = statSync(filePath);
            if (stats.isFile()) {
              const content = readFileSync(filePath);
              const ext = extname(filePath);

              // Set appropriate content type
              const contentType =
                ext === ".js"
                  ? "application/javascript"
                  : ext === ".wasm"
                    ? "application/wasm"
                    : ext === ".json"
                      ? "application/json"
                      : "application/octet-stream";

              res.setHeader("Content-Type", contentType);
              res.setHeader("Content-Length", stats.size);
              res.end(content);
              return;
            }
          } catch (error) {
            // If there's an error reading the file, continue to next middleware
            console.warn(
              `[serveJoltAssetsPlugin] Error serving ${filePath}:`,
              error,
            );
          }
        }

        // File not found, continue to next middleware
        next();
      });
    },
  };
};

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
 * Serve `t3d-extension/src/assets` during dev.
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

        if (method !== "GET") {
          return next();
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

// Note: T3DJoltLoader now handles conditional imports at runtime based on environment
// - VS Code webview: uses jolt-physics/wasm-compat (single-threaded)
// - Web browser: uses jolt-physics/wasm-compat-multithread (multi-threaded)
// No build-time transformation needed since loadJolt() uses dynamic imports

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
    t3dPackageResolverPlugin(), // Resolve @ternion/t3d subpath exports before other plugins
    skipJoltPhysicsPlugin(),
    serveJoltAssetsPlugin(), // Serve Jolt assets during development
    serveCoiServiceWorkerPlugin(), // `/t3d-coi-serviceworker.js` for T3DJoltLoader COI (dev)
    serveExtensionLocalAssetsPlugin(), // src/assets for Model Catalog (browser dev)
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
        ...(existsSync(project4CubemapTexturesPath)
          ? [
              {
                src: "../assets/textures/cubemap/**/*",
                dest: "./assets/textures/cubemap",
              },
            ]
          : []),
        ...(existsSync(project4RobotModelPath)
          ? [
              {
                src: "../assets/models/robot-4th-project/**/*",
                dest: "./assets/models/robot-4th-project",
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
                src: "../assets/sounds",
                dest: "./assets/sounds",
              },
            ]
          : []),
        // Copy Jolt assets to both /jolt and /assets/jolt for compatibility
        // Standardize on /jolt for all browser modes (same as main T3D app)
        // For /jolt: use glob pattern to copy contents directly (no nested directory)
        // For /assets/jolt: preserve directory structure (copy directory itself)
        ...(existsSync(localJoltPath)
          ? [
              {
                src: "../assets/jolt/**/*",
                dest: "./jolt", // Standardized path: /jolt (files directly in /jolt)
              },
              {
                src: "../assets/jolt",
                dest: "./assets", // Keep /assets/jolt for backward compatibility
              },
            ]
          : existsSync(joltPath)
            ? [
                {
                  src: "../../../assets/jolt/**/*",
                  dest: "./jolt", // Standardized path: /jolt (files directly in /jolt)
                },
                {
                  src: "../../../assets/jolt",
                  dest: "./assets", // Keep /assets/jolt for backward compatibility
                },
              ]
            : []),
        ...(existsSync(coiWorkerPath)
          ? [
              {
                // Use relative path from vite root (src/webview) to node_modules or linked T3D
                src: isPackageLinked()
                  ? "../../../T3D/dist/t3d-coi-serviceworker.js"
                  : "../../node_modules/@ternion/t3d/dist/t3d-coi-serviceworker.js",
                dest: "./",
                rename: "t3d-coi-serviceworker.js",
              },
            ]
          : []),
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/webview"),
      "@assets": resolve(__dirname, "src/assets"),
      /** CJS-only package; @ternion/t3d vscode-webview expects `import default` (see shim file). */
      crossoriginworker: resolve(
        __dirname,
        "src/webview/shims/crossoriginworker.ts",
      ),
      ...t3dResolveAliases,
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
    "import.meta.env.VITE_MQTT_BROKER_URL": JSON.stringify(
      process.env.VITE_MQTT_BROKER_URL || "ws://localhost:8083",
    ),
  },
  // Exclude jolt-physics files from Vite's dependency optimization
  // These files are dynamically imported at runtime and contain Node.js-specific code
  // Both multithreaded and single-threaded versions should be excluded
  optimizeDeps: {
    exclude: [
      "jolt-physics/wasm-compat-multithread",
      "jolt-physics/debug-wasm-compat-multithread",
      "jolt-physics/wasm-compat",
      "jolt-physics/debug-wasm-compat",
    ],
  },
  server: {
    port: 5173,
    /** Default: app launcher. Override only in scripts (e.g. dev-bitstream2-loopback → Bitstream Lab). */
    open: process.env.VITE_DEV_OPEN ?? "/?launcher=1",
    cors: true,
    fs: {
      // Allow serving files from node_modules
      allow: [
        // Extension webview directory
        resolve(__dirname, "src/webview"),
        // Model Catalog / bridge load GLB from extension assets (../assets from webview root)
        resolve(__dirname, "src/assets"),
        // Monorepo parent (T3D, shared assets) when resolving outside webview root
        resolve(__dirname, ".."),
        // Extension node_modules (includes @ternion/t3d)
        resolve(__dirname, "node_modules"),
        // Local T3D when developing against `file:../T3D` or monorepo fallback
        actualT3dPackageRoot,
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
    chunkSizeWarningLimit: 2000, // 3D stack (Three.js, Jolt, Rapier) produces large chunks
    outDir: resolve(__dirname, "out/webview"),
    cssCodeSplit: true,
    rollupOptions: {
      input: resolve(__dirname, "src/webview/index.html"),
      output: {
        entryFileNames: "index.js",
        // Use ES module format to support top-level await
        // This matches the type="module" in index.html
        format: "es",
        // Custom asset naming: CSS at root, other assets in subfolder
        // This ensures VS Code webview can load index.css from expected path
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0] === "index.css") {
            return "[name].[ext]"; // out/webview/index.css
          }
          return "assets/[name].[ext]"; // out/webview/assets/*
        },
      },
      // Mark jolt-physics files as external to prevent bundling
      // These files are dynamically imported at runtime and should not be processed by Rollup
      // Both multithreaded and single-threaded versions should be external
      external: (id) => {
        // Externalize all jolt-physics entry points
        if (
          id === "jolt-physics/wasm-compat-multithread" ||
          id === "jolt-physics/debug-wasm-compat-multithread" ||
          id === "jolt-physics/wasm-compat" ||
          id === "jolt-physics/debug-wasm-compat" ||
          id.includes(
            "jolt-physics/dist/jolt-physics.multithread.wasm-compat",
          ) ||
          id.includes(
            "jolt-physics/dist/jolt-physics.debug.multithread.wasm-compat",
          ) ||
          id.includes("jolt-physics/dist/jolt-physics.wasm-compat") ||
          id.includes("jolt-physics/dist/jolt-physics.debug.wasm-compat")
        ) {
          return true;
        }
        return false;
      },
      // Suppress harmless warnings about Node.js modules being externalized
      // These modules (module, worker_threads) are correctly externalized for browser builds
      onwarn(warning, warn) {
        // Suppress warnings about externalized Node.js modules
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
        // Suppress commonjs resolver warnings about IIFE format for jolt-physics files
        if (
          warning.message &&
          warning.message.includes(
            'Module format "iife" does not support top-level await',
          )
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
        // Use default warning handler for other warnings
        warn(warning);
      },
    },
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
