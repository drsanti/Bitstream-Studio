// @ts-nocheck
import react from "@vitejs/plugin-react";
import { resolve, dirname, extname, relative } from "path";
import { existsSync, readFileSync, statSync } from "fs";
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

// Bundled extension assets (free pack, tesaiot Model Loader samples)
const localAssetsPath = resolve(__dirname, "src/assets");
const freeTexturesPath = resolve(localAssetsPath, ...DEV_SRC_ASSET_DIRS.freeTextures);
const freeModelsPath = resolve(localAssetsPath, ...DEV_SRC_ASSET_DIRS.freeModels);
const tesaiotModelsPath = resolve(localAssetsPath, ...DEV_SRC_ASSET_DIRS.tesaiotModels);
const tesaiotTexturesPath = resolve(localAssetsPath, ...DEV_SRC_ASSET_DIRS.tesaiotTextures);
const localSoundsPath = resolve(localAssetsPath, "sounds");

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
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/webview"),
      "@assets": resolve(__dirname, "src/assets"),
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
