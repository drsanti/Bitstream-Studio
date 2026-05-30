# Landing page (`webview/landing`)

Browser dev / VSIX workspace picker (`BitstreamLanding`). Entry: **`BitstreamWebviewRoot.tsx`** (not a separate URL app).

## Routes (`BitstreamWebviewRoot`)

| Condition | View |
|-----------|------|
| `activeSimulationId != null` | `SimulationHub` (after WebGL transition splash) |
| `landingVisible && no sim` | `BitstreamLanding` |
| else | `BitstreamApp` (Sensor Telemetry / Studio toolbar) |

**Ctrl+/** → **Open workspace landing** (`useBitstreamLandingQuickCommands`) — works from workspace shell and simulations (VSIX + Vite).

Sim pick: `handleOpenSimulation` → `openSimulation(id)` + `closeLanding()`. See **`../shared/webgl/README.md`** for the WebGL teardown gap before the sim Canvas mounts.

## Backdrop modes

Double-click **empty** landing area (not on a card button) to cycle **backdrop**:

| Mode | Layers |
|------|--------|
| **2D only** | Gradient + overlay preset |
| **3D only** | WebGL cube floor (+ optional overlay) |
| **2D + 3D blend** | Cubes in front; 2D nebula/flow behind (transparent WebGL clear) |

**Shift+double-click** cycles **overlay** independently:

| Overlay | Nebula | Flow particles |
|---------|--------|----------------|
| Nebula + flow | on | on |
| Nebula only | on | off |
| Flow only | off | on |
| No overlay | off | off |

Default mode: **blend**. Persisted in `sessionStorage` (`bitstream-studio.landing.background-mode.v1`, `…background-overlay.v1`).

With `prefers-reduced-motion: reduce`, the 3D layer does not mount; 2D is used instead.

### Backdrop files

| File | Role |
|------|------|
| `bitstreamLandingBackgroundMode.store.ts` | Mode + overlay state |
| `BitstreamLandingBackground.tsx` | Compositor (2D + 3D layers) |
| `BitstreamLandingBackground2D.tsx` | Nebula + flow (`FlowCanvasBackground`, higher bubble density) |
| `BitstreamLandingBackground3D.tsx` | R3F welcome cube floor (**eager import**, not lazy) |
| `WelcomeBackground3DScene.tsx` | Cubes + floating shapes (sin/cos orbit on torus knot, icosahedron, torus) |
| `BitstreamLandingBackgroundModeHint.tsx` | Bottom-right mode badge |

## Cards (flat HTML — not CSS3D)

Workspace and simulation cards are **normal HTML** at `z-[15]` with `pointer-events-auto`. The R3F `<canvas>` uses `pointer-events-none` so clicks reach the cards.

| File | Role |
|------|------|
| `BitstreamLandingOptionCard.tsx` | Sensor Telemetry / Sensor Studio |
| `SimulationLandingOptionCard.tsx` | E84, ABB, Vehicle Physics |
| `LandingCardIcon.tsx` | TRN-style icon shell + hover pop/ring (matches `TRNFloatingNotice` pattern) |
| `LandingCardsParallax.tsx` | Wrapper only (no CSS 3D transform — transforms broke hit-testing) |

### Legacy CSS3D (unused — do not wire without re-testing)

`landing/css3d/` (`LandingCss3dOverlay`, `LandingCss3dCardSlot`, `LandingCss3dCameraSync`, …) was an MVP for reparenting cards into `CSS3DRenderer`. **Current product uses flat HTML cards.** Safe to delete in a future cleanup or revive behind a flag.

## Navigation helpers

| File | Role |
|------|------|
| `bitstreamLandingNav.ts` | Dev URL / landing visibility (**no store imports** — avoids circular init) |
| `bitstreamLandingActions.ts` | `returnToWorkspaceLanding`, `isWorkspaceLandingShown` |
| `bitstreamLanding.store.ts` | Overlay visibility (dev + VSIX) |
| `../utils/isViteDevMode.ts` | Safe `import.meta.env.DEV` + localhost fallback |

## Dev URL hints

| URL | Behavior |
|-----|----------|
| `/` | Landing (if not skipped via session) |
| `?app=bitstream&workspace=…` | Skip landing → workspace shell |
| `?sim=vehicle-physics` | Skip landing → simulation hub |
| `?landing=1` | Force landing |

VSIX host panel: usually opens app directly; landing available via **Ctrl+/** when implemented in panel webview.
