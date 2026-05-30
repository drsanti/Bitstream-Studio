# TRNWindow User Manual

`TRNWindow` is a floating window component with drag, resize, maximize/restore, optional modal backdrop, and reopen behavior control. It supports **viewport-wide** hosting (`position: fixed`) or **bounded** hosting inside a parent element (`boundsRef` + portal), optional **geometry persistence** (`persistRectStorageKey`), and compact chrome (`showFooter`, `showMaximize`).

---

## 1) Overview

Use `TRNWindow` when you need desktop-style floating UI:

- movable window (drag title bar)
- resizable frame (bottom-right handle)
- maximize / restore
- close callback
- optional modal backdrop
- optional controlled reopen strategy
- command-palette style catalog host (for example selection UIs)

---

## 2) Quick Start

```tsx
import { useState } from "react";
import { TRNWindow } from "@/components/ui/TRN/TRNWindow";

export function Example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Window</button>
      <TRNWindow
        open={open}
        title="My Window"
        onClose={() => setOpen(false)}
      >
        <div>Window content</div>
      </TRNWindow>
    </>
  );
}
```

---

## 3) Core Concepts

- **Open/Close**
  - `open` controls visibility
  - `onClose` handles close action (close button + modal backdrop)

- **Geometry**
  - Position + size are managed internally as `x`, `y`, `width`, `height`.
  - Initial geometry from `initialRect`.
  - Without `boundsRef`: clamped to the **browser viewport** (same as before).
  - With `boundsRef`: coordinates are **relative to the bounds element’s top-left**, and clamped to that element’s **client width/height** (drag, resize, maximize-to-fill, and reopen normalize all use the bounds box).

- **Interaction**
  - Drag by header (`draggable`)
  - Resize by bottom-right handle (`resizable`)
  - Maximize toggle in header

- **Reopen behavior**
  - `reopenStrategy` controls how geometry behaves on reopen

---

## 4) Props Reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | `true` | Show/hide window |
| `title` | `string` | `"Window"` | Header title text |
| `prefixIcon` | `ReactNode` | `PanelsTopLeft` icon | Header prefix icon |
| `children` | `ReactNode` | - | Window body content |
| `onClose` | `() => void` | `undefined` | Close handler |
| `initialRect` | `Partial<{x,y,width,height}>` | `{x:120,y:80,w:760,h:480}` | Initial geometry |
| `minWidth` | `number` | `360` | Min width clamp |
| `minHeight` | `number` | `220` | Min height clamp (also minimum shell height when `heightMode="auto"`) |
| `heightMode` | `"fixed" \| "auto"` | `"fixed"` | `fixed`: height from `rect` / `initialRect`. `auto`: shell height follows content; see §10 |
| `autoHeightMaxViewportFraction` | `number` | `0.8` | When `heightMode="auto"`, caps shell `max-height` as a fraction of the overlay (**viewport** without `boundsRef`, **`boundsRef`** client box when bounded). Content scroll cap uses the same measured overlay height. |
| `modal` | `boolean` | `true` | Show backdrop + outside click close |
| `zIndex` | `number` | `60` | Layer order |
| `draggable` | `boolean` | `true` | Enable header dragging |
| `resizable` | `boolean` | `true` | Enable resize handle |
| `reopenStrategy` | `"preserve" \| "normalize" \| "reset"` | `"normalize"` | Behavior on reopen |
| `className` | `string` | `""` | Extra class for outer window shell |
| `contentClassName` | `string` | `""` | Extra class for content area |
| `glass` | `boolean` | `false` | Enable glass/translucent rendering with backdrop blur |
| `glassPreset` | `"soft" \| "medium" \| "strong" \| "toolbox"` | `"medium"` | Glass intensity preset when `glass` is enabled (`toolbox` — lighter blur / higher transparency for 3D overlays; see [TRNToolboxPanel](./TRNToolboxPanel.md)) |
| `glassBlurPx` | `number` | preset-based | Override blur radius |
| `glassOpacity` | `number` | preset-based | Override shell opacity |
| `glassBorderOpacity` | `number` | preset-based | Override border opacity |
| `boundsRef` | `RefObject<HTMLElement \| null>` | `undefined` | When set, renders the window **inside** this element (portal). Geometry is parent-relative; clamp uses the bounds client box. Parent should be **`position: relative`** (and often `overflow: hidden`). |
| `showFooter` | `boolean` | `true` | Show or hide the bottom **Window metrics** footer. |
| `showMaximize` | `boolean` | `true` | Show or hide the maximize / restore header button. |
| `headerActions` | `ReactNode` | `undefined` | Extra controls in the header row (rendered before maximize / close). Use `pointerdown` `stopPropagation` on controls that must not start a drag. |
| `dragEdgeSnapPx` | `number` | `undefined` | While dragging, snap flush to overlay edges within this distance (px): **left** / **right** (`x`), **bottom** (`y`). Uses viewport or `boundsRef` box. Omit or `0` to disable. |
| `shellProps` | `TRNWindowShellProps` | `undefined` | Extra DOM props on the outer shell (`onKeyDown`, `tabIndex`, `data-*`). Internal `className` / `style` / layout merge with these. |
| `shellRef` | `Ref` to `HTMLDivElement` | `undefined` | Optional ref to the outer shell (merged with the internal shell ref). |
| `persistRectStorageKey` | `string` | `undefined` | LocalStorage key for `{ x, y, width, height }`. Loads once when opening (after size is known), saves after drag/resize ends and after maximize toggles. |

---

## 5) Reopen Strategy Guide

### `preserve`

Reopen with last rect exactly.

- Pros: no movement surprise
- Cons: can reopen out-of-bounds after viewport/container changes

### `normalize` (recommended)

Reopen with last rect, then clamp into current viewport.

- Pros: preserves intent, avoids off-screen reopen
- Cons: may shift slightly after resize

### `reset`

Reopen from `initialRect` (clamped).

- Pros: deterministic every open
- Cons: ignores user-adjusted last position

---

## 6) Interaction Examples

### A) Modal tool window

```tsx
<TRNWindow
  open={open}
  title="Toolbox"
  onClose={() => setOpen(false)}
  modal
  draggable
  resizable
>
  <Toolbox />
</TRNWindow>
```

### B) Non-modal floating panel

```tsx
<TRNWindow
  open={open}
  title="Inspector"
  modal={false}
  draggable
  resizable={false}
>
  <Inspector />
</TRNWindow>
```

### C) Fixed startup geometry

```tsx
<TRNWindow
  open={open}
  title="Examples"
  initialRect={{ x: 100, y: 60, width: 960, height: 640 }}
  minWidth={560}
  minHeight={360}
>
  <Examples />
</TRNWindow>
```

### D) Controlled reopen behavior

```tsx
<TRNWindow
  open={open}
  title="Metrics"
  reopenStrategy="normalize"
>
  <MetricsPanel />
</TRNWindow>
```

### E) Example Catalog window pattern

```tsx
<TRNWindow
  open={showExampleCatalog}
  onClose={() => setShowExampleCatalog(false)}
  title="Example Catalog (Ctrl/Cmd+K)"
  modal
  draggable
  resizable
  initialRect={{ x: 140, y: 92, width: 860, height: 620 }}
  minWidth={620}
  minHeight={420}
>
  <TRNExampleCatalogWindowContent />
</TRNWindow>
```

---

## 7) Header, Footer, and Controls

Current built-in UI:

- Prefix icon + title in header
- Maximize / restore button (omit with `showMaximize={false}`)
- Close button (when `onClose` provided)
- Footer with live metrics (omit with `showFooter={false}`):
  - `x`, `y`, `w`, `h`
  - When `heightMode="auto"` (and not maximized), `h` shows the **measured** shell height and is suffixed with **`(auto)`**

Common app-level extras built on top of `TRNWindow`:

- searchable catalog body (input + grouped list)
- keyboard navigation (`↑`, `↓`, `Enter`, `Esc`)
- open shortcut (`Ctrl+K` on Windows/Linux, `Cmd+K` on macOS)

---

## 8) Accessibility

`TRNWindow` root uses:

- `role="dialog"`
- `aria-modal={modal}`
- `aria-label={title}`

Control buttons expose:

- `aria-label` and `title` for maximize/restore/close

Recommendations:

- use meaningful `title`
- ensure close action is always reachable for modal windows

---

## 9) Best Practices and Pitfalls

- Prefer `reopenStrategy="normalize"` for responsive layouts.
- Keep `minWidth`/`minHeight` realistic to avoid cramped content.
- For heavy content, use `contentClassName` and internal layout containers.
- If modal is enabled, avoid nesting with other full-screen modal backdrops.
- If non-modal is enabled, manage z-index stacking consistently.

---

## 10) Auto height mode (`heightMode="auto"`)

Use **`heightMode="auto"`** when the window should **shrink-wrap** its body (tool palettes, short lists) instead of keeping a fixed pixel height.

Behavior:

- Shell uses **`height: auto`**, with **`max-height`** set from **`autoHeightMaxViewportFraction`** (default **0.8**, as a **percentage** of the overlay host — full viewport when unbounded, or the **`boundsRef`** element when bounded).
- Title bar and footer are **`shrink-0`**; the **content** area scrolls when content exceeds **`calc(fraction × overlayHeightPx − title − footer)`**, where **`overlayHeightPx`** is the measured height of that overlay (viewport or bounds), **not** raw `100vh` alone — so auto-height respects bounded panels.
- **`reopenStrategy="reset"`** pairs well so each open snaps geometry back to **`initialRect`** while height still follows content.
- **Resize handle**: in `auto` mode, only **width** (and position clamping) updates; height stays content-driven.
- **Window `resize` / reopen normalize**: only **x, y, width** are re-clamped so stored `rect.height` does not fight content layout.

Avoid **`flex-1` / `h-full`** on immediate children if you want a tight vertical hug; let the body grow naturally and scroll inside the window content region.

---

## 11) Bounded parent mode (`boundsRef`)

Use **`boundsRef`** when the window must live **inside a panel** (3D viewport, card body, split pane) instead of covering the full webview.

Requirements:

- The bounds element should use **`position: relative`** so the portaled overlay (`absolute inset-0`) positions correctly.
- Geometry (`initialRect`, persisted rect, drag, resize, **maximize**) is expressed in **pixels relative to the bounds element** (origin top-left).
- A **`ResizeObserver`** on the bounds element keeps the window clamped when the parent shrinks or grows.
- When **`boundsRef` is set** but the ref has not mounted yet, `TRNWindow` returns **`null`** until the host exists (one frame / layout).

Modal backdrop (`modal={true}`) fills **only the bounds region**, not the entire page.

### Example: compact panel inside a container

```tsx
const panelRef = useRef<HTMLDivElement>(null);

return (
  <div ref={panelRef} className="relative min-h-[240px] overflow-hidden rounded-md">
    <TRNWindow
      open
      title="Tools"
      boundsRef={panelRef}
      modal={false}
      showFooter={false}
      showMaximize={false}
      minWidth={200}
      minHeight={120}
      initialRect={{ x: 8, y: 8, width: 320, height: 200 }}
      persistRectStorageKey="my-app:tools-window-rect"
    >
      <YourPanelBody />
    </TRNWindow>
  </div>
);
```

Live demo: TRN Example Catalog → **TRNWindow** → tab **Bounded + Auto Height** (`heightMode="auto"` + long scroll body inside `boundsRef`).

### Persistence (`persistRectStorageKey`)

- Stored value is JSON: `{ "x", "y", "width", "height" }`.
- Hydration runs **once** per key after the viewport or bounds size is known; invalid numbers are ignored.
- Saving occurs on **pointer up** after drag/resize and when **maximize/restore** is clicked.

### Helper export

`normalizeRect(rect, viewportWidth, viewportHeight, minWidth, minHeight)` is exported for tests and custom geometry logic.

---

## 12) Troubleshooting

### Window opens partially off-screen

- Use `reopenStrategy="normalize"` (default).
- Ensure `initialRect` is valid for target viewport.

### Cannot drag window

- Check `draggable !== false`.
- Drag starts on header only.
- Drag is disabled while maximized.

### Cannot resize window

- Check `resizable !== false`.
- Resize is disabled while maximized.
- Drag the bottom-right handle.

### Maximize does not fill the intended region

- Without `boundsRef`, maximize uses the **browser viewport**.
- With `boundsRef`, maximize fills the **bounds element**. Ensure the bounds element has a non-zero size and `position: relative`.

### Global shortcut does not open catalog

- Confirm app-level key handler is registered where `showExampleCatalog` state lives.
- Use `Ctrl+K` (Windows/Linux) or `Cmd+K` (macOS).
- Shortcut should ignore editable targets (`input`, `textarea`, `select`, `contentEditable`).

---

## Appendix: Full Example

```tsx
<TRNWindow
  open={showWindow}
  title="TRNContainer Examples"
  onClose={() => setShowWindow(false)}
  modal
  draggable
  resizable
  reopenStrategy="normalize"
  initialRect={{ x: 120, y: 88, width: 980, height: 680 }}
  minWidth={560}
  minHeight={360}
>
  <TRNContainerExample />
</TRNWindow>
```

### Appendix B: Auto-height tool window

```tsx
<TRNWindow
  open={open}
  title="Serial ports"
  onClose={() => setOpen(false)}
  modal
  draggable
  resizable
  reopenStrategy="reset"
  heightMode="auto"
  autoHeightMaxViewportFraction={0.8}
  initialRect={{ x: 150, y: 120, width: 560, height: 320 }}
  minWidth={460}
  minHeight={160}
>
  <YourCompactBody />
</TRNWindow>
```
