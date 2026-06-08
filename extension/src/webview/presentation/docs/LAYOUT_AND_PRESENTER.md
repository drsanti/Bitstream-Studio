# Presentation — layout system & presenter tools

## Slide page anatomy

Every slide canvas uses up to three zones:

| Zone | Role |
|------|------|
| **Heading** | Eyebrow, title, subtitle, optional badge |
| **Body** | Primary content (`main`, `visual`, `scene`, or `children`) |
| **Footer** | On-screen caption, hints, demo status |

Implement via **`SlidePage`** (`layout/SlidePage.tsx`) or wrappers **`TheorySlideLayout`**, **`DemoSlideLayout`**, **`TitleHeroLayout`**.

## Layout catalog

| `layout` | Use when |
|----------|----------|
| `stack` | Bullets, objectives, single-column theory |
| `full-center` | Centered title / quote |
| `split-50` | Theory + diagram (equal columns) |
| `split-40-60` | Copy + dominant visual |
| `split-60-40` | Dominant copy + side visual |
| `hero-title` | Chapter opener (copy + hero visual) |
| `demo-rail` | Controls left (max ~400px), 3D/scene fills remaining width edge-to-edge |
| `grid-2x2` | Four KPI tiles under heading |
| `grid-2x3` | Six KPI tiles (e.g. 6-DoF snapshot) |
| `table-focus` | Full-width table under heading |
| `immersive` | Full-bleed body only |

Example:

```tsx
<SlidePage
  layout="split-50"
  heading={{ eyebrow: "Foundations", title: "Coordinates", subtitle: "…" }}
  footer="Flat → aZ ≈ +1 g"
  main={<TheoryBulletList items={…} />}
  visual={<AxisTriadSvg />}
/>
```

## Presenter tools

Store: **`usePresentationPresenterStore`**

| Control | UI | Shortcut |
|---------|-----|----------|
| Present mode | Toolbar | **P** — hides chapter sidebar |
| Laser pointer | Toolbar | **L** — pauses **OrbitControls** on 3D scenes while active |
| Zoom in/out | Toolbar | **+** / **−** |
| Reset zoom/pan | Toolbar | **0** |
| Pan (when zoom > 1) | — | **Shift + arrows** |
| Wheel zoom | — | **Ctrl + wheel** |
| Fullscreen | Toolbar | **F** |
| Exit laser/zoom/present | — | **Esc** (staged) |

Zoom/pan applies to **`SlideViewport`** only (slide canvas), not the VS Code shell.

## 3D scenes

All presentation R3F scenes use **`PresentationOrbitControls`** — rotate, pan, and zoom enabled.

Path: `widgets/r3f/PresentationOrbitControls.tsx`

**Laser + 3D:** When the laser is on, orbit controls are disabled (`enabled={false}`), canvases use `pointer-events: none`, and the viewport captures pointer movement so the red dot tracks over 3D panels. Press **L** or **Esc** to resume orbiting.

**Live parameters on scene:** For dense numeric readouts (e.g. quaternion), use `PresentationSceneLiveOverlay` + `PresentationSceneParamRow` on `BmiPcbOrientationScene` `overlay` prop — compact HUD over the canvas; left rail keeps theory copy only.

## Files

```text
layout/
  SlidePage.tsx
  SlideHeading.tsx
  SlideViewport.tsx
  LaserPointerOverlay.tsx
  PresenterToolbar.tsx
  slide-layout.types.ts
store/
  usePresentationPresenterStore.ts
app/
  attachPresentationPresenterNav.ts
```
