# Presentation — Bitstream Studio integration

**Status:** Phase 0 scaffold shipped (2026-06-08)

## Architecture

Presentation is a **third Bitstream Studio workspace** — not a separate Vite app with its own WebSocket decoder.

```text
BitstreamShellRoot (broker + live store)
  └── workspace === "presentation"
        └── PresentationWorkspace
              └── reads useBitstreamLiveStore (no duplicate decode)
```

## Entry points

| Entry | How |
|-------|-----|
| **Workspace tab** | Toolbar **Presentation** · `?workspace=presentation` in browser dev |
| **VS Code side panel** | Command **Open Presentation** → `PresentationPanel` → second webview column |
| **Browser** | `http://localhost:5173/?workspace=presentation` (with `npm run dev:webview`) |

Main and presentation panels are **separate webview instances** (separate slide state). Both subscribe to the same broker via the shared shell bootstrap.

## Themes

Presentation supports **light** and **dark** themes:

- Store: `usePresentationThemeStore` (`localStorage`: `bitstream-studio.presentation.theme.v1`)
- CSS variables scoped under `.presentation-root[data-presentation-theme="dark|light"]`
- Toggle: sun/moon control in `PresentationTopBar`

Themes are independent of the VS Code workbench theme.

## Data layer

| Layer | Location |
|-------|----------|
| Broker subscribe | `BitstreamShellRoot` → `useBitstream2TelemetryBridge` |
| Mask → fields | `bs2-sample-to-live-v2.ts` |
| Live store | `useBitstreamLiveStore.latestByHint` |
| Slide units | `presentation/display/selectors.ts` |
| Hook | `usePresentationBmi270()` |

## File layout

```text
extension/src/webview/presentation/
  PresentationWorkspace.tsx
  chapters/           ← bitstream-studio, bmi270, …
    _shared/layouts/  ← TheorySlideLayout, DemoSlideLayout, LabSlideLayout
  layout/             ← shell, sidebar, notes, top bar
  design/             ← light/dark theme tokens
  display/            ← store → slide units
  app/                ← chapter navigation + sensor hooks
```

### Shipped slides

| Chapter | Slides | Mode |
|---------|--------|------|
| `bitstream-studio` | 20 | theory + demo |
| `bmi270` | 16 | theory + demo |
| `euler-quaternion` | 11 | theory + demo |

Platform demos: `usePresentationBridgeStatus()`, `usePresentationSensorRows()`.

BMI270 / fusion demos: `usePresentationBmi270()` + `Bmi270FrameRefSync` for R3F scenes (`widgets/r3f/`).

## Visual system (2D + 3D)

| Layer | Path | Role |
|-------|------|------|
| Slide atmosphere | `chapters/_shared/visual/SlideBackdrop.tsx` | Per-chapter gradient mesh + grid (wired in `PresentationShell`) |
| Glass panels | `PresentationVisualPanel.tsx` | Frames SVG diagrams and 3D viewports |
| Title hero | `TitleHeroLayout.tsx` | Chapter entry slides with optional 3D/SVG hero |
| 2D diagrams | `chapters/_shared/visual/diagrams/*.tsx` | SVG teaching art (axes, fusion pipeline, MEMS, …) |
| 3D stage | `widgets/r3f/PresentationStage.tsx` | Grid floor, shadows, shared lighting |
| 3D scenes | `widgets/r3f/*` | PCB orientation, gyro gimbal, axis triad, title heroes |

`TheorySlideLayout` accepts optional `visual` for split theory + diagram panels.

## Layout & presenter tools

See **`LAYOUT_AND_PRESENTER.md`** — `SlidePage` layouts (heading/body/footer), present mode, zoom, laser pointer, and full **OrbitControls** on all 3D scenes.

## Chapters (registry)

| Chapter | ID | Live hook |
|---------|-----|-----------|
| Bitstream Studio | `bitstream-studio` | bridge status, multi-sensor rows |
| BMI270 | `bmi270` | `usePresentationBmi270()` |
| Euler & Quaternion | `euler-quaternion` | `usePresentationBmi270()` (fusion fields) |
| BMM350 | `bmm350` | `usePresentationBmm350()` |
| DPS368 | `dps368` | `usePresentationDps368()` |
| SHT40 | `sht40` | `usePresentationSht40()` |

Legacy standalone app: `presentation/` at repo root (archive only).

## Keyboard shortcuts (presentation focus)

| Key | Action |
|-----|--------|
| ← → | Previous / next slide |
| R | Theory reader (markdown + LaTeX side panel) |
| S | Speaker notes |
| F | Fullscreen |

### Theory reader (`theory.md`)

Slides may ship an optional **`theory.md`** next to `notes.md` — deep-dive content for students/engineers (definitions, derivations, tables). Rendered with KaTeX for `$...$` and `$$...$$` math. Toggle with **R** or the book icon in the presenter toolbar when the current slide has theory content.

Workspace switch (browser): **Ctrl+Shift+3** → Presentation.

## Related docs

- `presentation/docs/DEVELOPMENT_PLAN.md` (repo root) — chapter outlines and pedagogy
- `extension/docs/TELEMETRY_MODE_LIFECYCLE.md` — Bitstream vs Simulator
