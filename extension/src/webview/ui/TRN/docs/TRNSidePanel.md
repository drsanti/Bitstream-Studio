# TRNSidePanel User Manual

`TRNSidePanel` is a reusable side container for inspector/settings/properties panes.

## Features

- Left or right side panel (`side`)
- Docked or overlay mode (`mode`)
- Variant presets (`default`, `inspector`, `settings`) with sensible defaults
- Collapse/expand with animation
- Drag resize (works in expanded and collapsed states)
- Keyboard resize on separator (`ArrowLeft/ArrowRight`, `Home/End`)
- Optional glass style and backdrop modes (`none`, `dim`, `blur`)
- Optional hotkey toggle (`toggleHotkey` / `toggleHotkeys`)
- Optional local persistence (`persistKey`) for width + collapsed state

## Quick Start

```tsx
import { TRNSidePanel, TRNSectionContainer } from "@/components/ui/TRN";

<div className="relative h-[520px]">
  <TRNSidePanel
    side="right"
    mode="overlay"
    title="Inspector"
    defaultWidth={360}
    glass
    backdrop="blur"
    closeOnOutsideClick
    closeOnEsc
    toggleHotkeys={["ctrl+\\", "cmd+\\"]}
    persistKey="inspector-panel"
  >
    <TRNSectionContainer title="Properties">
      {/* ... */}
    </TRNSectionContainer>
  </TRNSidePanel>
</div>;
```

## Key Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `"left" \| "right"` | `"right"` | Side placement |
| `mode` | `"docked" \| "overlay"` | `"docked"` | Layout mode |
| `variant` | `"default" \| "inspector" \| "settings"` | `"default"` | Visual preset for panel border emphasis |
| `defaultWidth` / `width` | `number` | by `variant` | Uncontrolled / controlled width |
| `minWidth` / `maxWidth` | `number` | by `variant` | Width clamp |
| `resizable` | `boolean` | `true` | Enable drag resize |
| `collapsible` | `boolean` | `true` | Show collapse controls |
| `defaultCollapsed` / `collapsed` | `boolean` | `false` | Uncontrolled / controlled collapse |
| `collapsedWidth` | `number` | by `variant` | Rail width while collapsed |
| `collapsedPresentation` | `"rail" \| "floating-only"` | `"rail"` | Collapsed UI style: classic rail or floating icon only |
| `collapsedFloatingAnchor` | `{ top?, right?, bottom?, left? }` | side-aware default | Anchor for floating collapsed icon |
| `collapsedFloatingSize` | `number` | `16` | Layout box (px) for floating anchor clamping; icon is glyph-only (`h-4 w-4`) |
| `collapsedFloatingZIndex` | `number` | auto | Z-index override for floating collapsed icon |
| `showInnerEdgeCollapse` | `boolean` | `true` | When expanded, show collapse affordance near the inner vertical edge (past the resize strip) |
| `innerEdgeCollapseZonePx` | `number` | `12` | Horizontal depth (px) from the inner edge that reveals the affordance |
| `innerEdgeCollapseHideDelayMs` | `number` | `220` | Delay before hiding after the pointer leaves the zone (ms) |
| `onToggle` | `(nextCollapsed, reason) => void` | `undefined` | Fires when collapse state toggles (`reason`: `button`, `inner-edge`, `hotkey`, `outside-click`, `esc`, `programmatic`) |
| `animated` | `boolean` | `true` | Enable transitions |
| `animationDurationMs` | `number` | `440` | Width/opacity transition duration (also used for floating collapsed trigger delay) |
| `animationEasing` | `string` | `cubic-bezier(0.22, 1, 0.36, 1)` | CSS transition timing |
| `overlayOffset` | `{ top?, right?, bottom?, left? }` | `undefined` | Insets for overlay panel/backdrop (e.g. keep top toolbar visible) |
| `backdrop` | `"none" \| "dim" \| "blur"` | by `variant` (overlay) | Overlay backdrop style |
| `glass` | `boolean` | by `variant` (overlay) | Translucent panel surface in overlay mode |
| `closeOnOutsideClick` | `boolean` | `false` | Close overlay when clicking outside |
| `closeOnEsc` | `boolean` | `true` | Close overlay on Escape when `onRequestClose` is set |
| `toggleHotkey` | `string \| null` | `null` | Single legacy hotkey |
| `toggleHotkeys` | `string[]` | `[]` | Multiple hotkeys (e.g. Ctrl+\\ and Cmd+\\) |
| `persistKey` | `string` | `undefined` | Save/restore width + collapsed to localStorage |
| `footer` | `ReactNode` | `undefined` | Optional footer below scrollable content (expanded only) |
| `footerClassName` | `string` | `""` | Extra classes on the footer strip |
| `showDimensionsFooter` | `boolean` | `false` | When true, footer shows live outer panel size `W × H px` via `ResizeObserver` (expanded only) |

## Notes

- In `overlay` mode, place the panel inside a `relative` parent.
- `variant` presets only apply when related props are omitted; explicit props always override presets.
- In `collapsedPresentation="floating-only"`, the collapsed rail block is hidden and only a floating expand icon is shown.
- Floating anchor default is side-aware center (`left/right: 0`, `top: 50%`); pass `collapsedFloatingAnchor` for custom positions.
- If both `toggleHotkey` and `toggleHotkeys` are provided, both are active.
- `persistKey` applies to uncontrolled state. Controlled props still take priority.
- Dimensions in `showDimensionsFooter` reflect the panel `<aside>` bounding box (includes header/footer chrome), rounded to integer pixels.
- With `collapsible` and expanded UI (not `floating-only` collapsed chrome), a collapse control is centered on the **seam** between the main area and the panel (half straddles each side) and fades in when the pointer is within the vertical span of the panel and within the inner-edge band (resize strip + `innerEdgeCollapseZonePx`) of that seam; a global `pointermove` listener is used so the affordance also works from the main content side. The resize handle remains the first 4px (`w-1` separator, higher z-index than the icon).

## Recipes

### Inspector, floating-only, centered icon

```tsx
<TRNSidePanel
  side="right"
  mode="docked"
  variant="inspector"
  collapsedPresentation="floating-only"
  defaultCollapsed
/>
```

### Floating icon with custom top anchor

```tsx
<TRNSidePanel
  side="right"
  mode="docked"
  collapsedPresentation="floating-only"
  collapsedFloatingAnchor={{ right: 12, top: 84 }}
  collapsedFloatingSize={36}
/>
```

### Controlled collapsed state with toggle reason

```tsx
const [collapsed, setCollapsed] = useState(false);
const [lastReason, setLastReason] = useState<string>("none");

<TRNSidePanel
  collapsed={collapsed}
  onToggle={(next, reason) => {
    setCollapsed(next);
    setLastReason(reason);
  }}
/>;
```

## Accessibility and Keyboard

- The resize handle is focusable (`role="separator"` + `tabIndex=0`).
- Handle keyboard map:
  - `ArrowLeft` / `ArrowRight`: resize by 12px
  - `Shift + Arrow`: resize by 24px
  - `Home`: jump to `minWidth`
  - `End`: jump to `maxWidth`
- Overlay close behavior:
  - `Escape` closes when `closeOnEsc` is true and `onRequestClose` is provided.
- Hotkey toggle:
  - Use `toggleHotkeys` for cross-platform shortcuts, e.g. `["ctrl+\\\\", "cmd+\\\\"]`.
