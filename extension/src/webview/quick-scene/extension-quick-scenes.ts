import type { T3DQuickSceneInfo } from "@ternion/t3d";

/**
 * Quick scenes registered only in the VS Code / Cursor webview (or Vite browser dev).
 * Add entries here and ensure React components live under `src/webview/**` for Tailwind.
 *
 * Serial Monitor is registered in `main.tsx` next to `registerQuickScenes`.
 *
 * Built-in demos remain in T3D `T3DQuickSceneList`; this array is merged at runtime via
 * `registerQuickScenes` in `main.tsx`.
 */
export const extensionQuickScenes: T3DQuickSceneInfo[] = [];
