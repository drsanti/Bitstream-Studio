# WebGL route transitions (`shared/webgl`)

Prevents React DOM / R3F teardown races when switching between routes that each own an `@react-three/fiber` **Canvas** (landing backdrop ↔ Digital Twin simulations).

## Problem

Mounting a new Canvas in the same React commit as unmounting another causes:

- `NotFoundError: Failed to execute 'removeChild' on 'Node'`
- `THREE.WebGLRenderer: Context Lost`
- (Previously) minified React **#321** when lazy chunks duplicated React — fixed separately via eager imports + `vite.config.ts` `manualChunks`.

## Modules

| File | Role |
|------|------|
| `webglSurfaceTransition.ts` | Tracks last Canvas unmount time; `useWebGLSurfaceReady(wantMount)` delays mount ~80 ms + 2 rAF |
| `WebGLSurfaceLifecycle.tsx` | Mount **inside** every R3F Canvas; registers mount/unmount |
| `WebGLRouteTransitionSplash.tsx` | Full-screen placeholder during the quiet gap |

## Integration

| Consumer | Usage |
|----------|--------|
| `landing/BitstreamWebviewRoot.tsx` | Gates `BitstreamLanding` and `SimulationHub` with `useWebGLSurfaceReady` |
| `landing/BitstreamLandingBackground3D.tsx` | `<WebGLSurfaceLifecycle />` inside landing Canvas |
| `simulations/shared/canvas/SimulationCanvas.tsx` | `<WebGLSurfaceLifecycle />` inside sim Canvas |
| `simulations/SimulationHost.tsx` | Defers rendering loaded sim app until `useWebGLSurfaceReady(AppComponent != null)` |

## Build

`extension/vite.config.ts` — `rollupOptions.output.manualChunks` puts **react** and **@react-three/fiber** / **three** into shared **`vendor-react`** and **`vendor-r3f`** chunks so code-split sim apps do not bundle a second React copy.

## Agent notes

- Do **not** re-introduce `lazy()` for `SimulationHost` or `BitstreamLandingBackground3D` without fixing chunk dedupe.
- R3F hook files should use **`"use no memo"`** (React Compiler opt-out) when using `useFrame` / `useThree`.
- **Never use positive `useFrame` priority** unless the callback calls `gl.render` — priority &gt; 0 disables R3F auto-render (black canvas with a healthy scene). See **`course-studio/docs/SCENE_3D_EDITOR.md`** § Viewport guardrails.
- A single **Context Lost** log during the splash transition is acceptable; the next Canvas should recover.
