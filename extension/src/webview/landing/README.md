# Landing page (`webview/landing`)

Browser dev / VSIX workspace picker (`BitstreamLanding`).

## Backdrop modes

Double-click **empty** landing area (not on a card button) to cycle **backdrop**:

| Mode | Layers |
|------|--------|
| **2D only** | Gradient + overlay preset |
| **3D only** | WebGL cube floor (+ optional overlay) |
| **2D + 3D blend** | Cubes + gradient/overlay at reduced opacity |

**Shift+double-click** cycles **overlay** independently:

| Overlay | Nebula | Flow particles |
|---------|--------|----------------|
| Nebula + flow | on | on |
| Nebula only | on | off |
| Flow only | off | on |
| No overlay | off | off |

Mode persists in `sessionStorage` (`bitstream-studio.landing.background-mode.v1`).
Overlay persists in `sessionStorage` (`bitstream-studio.landing.background-overlay.v1`).

### Files

- `bitstreamLandingBackgroundMode.store.ts` — mode + overlay state
- `BitstreamLandingBackground2D.tsx` — nebula + flow
- `BitstreamLandingBackground3D.tsx` + `WelcomeBackground3DScene.tsx` — R3F port (v1 welcome cubes)
- `BitstreamLandingBackground.tsx` — compositor (lazy-loads 3D)
- `bitstreamLandingNav.ts` — dev URL / landing visibility (no store imports — avoids circular init)
- `bitstreamLandingActions.ts` — `returnToWorkspaceLanding`, quick-command helpers
- `../utils/isViteDevMode.ts` — safe `import.meta.env.DEV` + localhost fallback

With `prefers-reduced-motion: reduce`, the 3D layer does not mount; 2D is used instead.

## Dev routing

| URL | Behavior |
|-----|----------|
| `/` | Landing (if not skipped via session) |
| `?app=bitstream&workspace=…` | Skip landing → workspace shell |
| `?sim=vehicle-physics` | Skip landing → simulation hub |
| `?landing=1` | Force landing |

## Phase 2 (in progress): CSS3D landing cards

Target: `BitstreamLandingOptionCard` and `SimulationLandingOptionCard` in Three.js
`CSS3DRenderer` space, camera-synced with the R3F cube floor for parallax.

| Module | Role |
|--------|------|
| `css3d/landingCss3dCamera.store.ts` | Camera + viewport from R3F |
| `css3d/LandingCss3dCameraSync.tsx` | `useFrame` publisher inside Canvas |
| `css3d/LandingCss3dOverlay.tsx` | CSS3DRenderer + card registry |
| `css3d/LandingCss3dCardSlot.tsx` | Registers card DOM for CSS3D |
| `css3d/landingCss3dLayout.ts` | Card positions in scene space |
| `css3d/LandingCss3dCameraSync.tsx` | R3F → CSS3D camera sync |

Active when backdrop mode is **3D** or **blend** (not **2D only**). Flat HTML fallback for 2D-only and reduced motion.
