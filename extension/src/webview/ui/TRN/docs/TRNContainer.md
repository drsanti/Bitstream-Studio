# TRNContainer User Manual

`TRNContainer` is a reusable layout wrapper for building panels, sections, grids, and scrollable blocks with a single API.

In the current TRN demo workflow, `TRNContainer` examples are selected from a shared Example Catalog and opened in a `TRNWindow`.

---

## 1) Overview

Use `TRNContainer` when you want a consistent container with:

- layout control (`flex`, `grid`, `wrap`, `stack`)
- sizing mode (`fill-parent`, `fit-content`)
- direction control (`row`, `column`)
- spacing control (`gap`)
- scroll behavior (`none`, `x`, `y`, `both`)

---

## 2) Quick Start

```tsx
import { TRNContainer } from "@/components/ui/TRN/TRNContainer";

export function Example() {
  return (
    <TRNContainer mode="fill-parent" layout="stack" gap="2" scroll="y">
      <div>Item A</div>
      <div>Item B</div>
    </TRNContainer>
  );
}
```

---

## 3) Core Concepts

- **mode**
  - `fill-parent`: expands to parent size (`w-full h-full min-h-0 flex-1`)
  - `fit-content`: wraps content (`w-fit h-fit`)
- **layout**
  - `flex`: flexible row/column layout
  - `grid`: fixed column grid
  - `wrap`: flex + wrapping
  - `stack`: vertical stack
- **direction**
  - used in `flex` and `wrap` (`row`, `column`)
- **gap**
  - spacing token: `"0" | "1" | "2" | "3" | "4" | "6" | "8"`
- **scroll**
  - `none`, `x`, `y`, `both`

---

## 4) Props Reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `mode` | `"fill-parent" \| "fit-content"` | `"fill-parent"` | Container sizing strategy |
| `layout` | `"flex" \| "grid" \| "wrap" \| "stack"` | `"flex"` | Layout behavior |
| `direction` | `"row" \| "column"` | `"column"` | Main axis for `flex`/`wrap` |
| `cols` | `1 \| 2 \| 3 \| 4 \| 6 \| 12` | `2` | Grid columns when `layout="grid"` |
| `gap` | `"0" \| "1" \| "2" \| "3" \| "4" \| "6" \| "8"` | `"2"` | Gap token |
| `scroll` | `"none" \| "x" \| "y" \| "both"` | `"none"` | Overflow behavior |
| `className` | `string` | `""` | Extra utility classes |
| `...divProps` | `HTMLAttributes<HTMLDivElement>` | - | Native DOM props (`id`, `style`, `role`, `aria-*`, `onClick`, etc.) |
| `ref` | `React.Ref<HTMLDivElement>` | - | Forwarded ref to root container |

---

## 5) Layout Patterns

### A) Fill Parent + Vertical Stack

```tsx
<TRNContainer mode="fill-parent" layout="stack" gap="2">
  <div>Header</div>
  <div>Body</div>
</TRNContainer>
```

### B) Grid Cards

```tsx
<TRNContainer mode="fit-content" layout="grid" cols={3} gap="4" className="w-full">
  <div>Card A</div>
  <div>Card B</div>
  <div>Card C</div>
</TRNContainer>
```

### C) Wrap Chips

```tsx
<TRNContainer mode="fit-content" layout="wrap" direction="row" gap="2" className="w-full">
  <span>chip-1</span>
  <span>chip-2</span>
  <span>chip-3</span>
</TRNContainer>
```

### D) Flex Split Row

```tsx
<TRNContainer
  mode="fit-content"
  layout="flex"
  direction="row"
  className="w-full justify-between items-center"
>
  <div>Left</div>
  <div>Right</div>
</TRNContainer>
```

---

## 6) Scroll Behavior Examples

### Y Scroll

```tsx
<TRNContainer mode="fill-parent" layout="stack" scroll="y">
  {/* long content */}
</TRNContainer>
```

### X Scroll

```tsx
<TRNContainer mode="fit-content" layout="stack" scroll="x" className="w-full">
  <div className="w-[800px]">Very wide content</div>
</TRNContainer>
```

### Both Axes

```tsx
<TRNContainer mode="fill-parent" layout="stack" scroll="both">
  {/* large content in both dimensions */}
</TRNContainer>
```

---

## 7) Styling and Theming

`TRNContainer` merges base classes with your `className`.  
Use `className` for custom visuals:

```tsx
<TRNContainer className="border border-[var(--border)] bg-[var(--card)] rounded-md" />
```

Recommended:

- keep layout props for structure (`layout`, `direction`, `scroll`)
- use `className` for visual decoration only

---

## 8) Accessibility

Since native div props are supported, add semantic/accessibility attributes when needed:

```tsx
<TRNContainer
  role="region"
  aria-label="Sensor status panel"
  data-testid="sensor-panel"
>
  ...
</TRNContainer>
```

---

## 9) Best Practices and Pitfalls

- For `fill-parent`, ensure parent has constrained size and `min-h-0` in flex chains.
- Use `scroll="y"` for long lists to avoid whole-page scroll conflicts.
- Prefer `layout="stack"` for vertical form/panel flows.
- Use `grid` only when fixed columns are intended.

---

## 10) Troubleshooting

### Problem: `fill-parent` does not fill space

Check parent chain:

- parent has explicit height or flex-fill context
- `min-h-0` is present in flex layouts where overflow is needed

### Problem: scroll does not appear

- verify `scroll` is set (`y`, `x`, or `both`)
- verify content actually exceeds container size
- verify parent sizing is constrained (otherwise container just grows)

### Problem: grid looks wrong

- verify `layout="grid"`
- verify `cols` value is one of supported tokens (`1,2,3,4,6,12`)

### Problem: selected example does not open the expected tab

- verify selected tab id exists in `TRN_CONTAINER_EXAMPLE_TABS`
- verify the catalog maps selection to `activeTab` in `TRNContainerExample`
- ensure example registry ids and component tab ids remain identical

---

## Appendix: Wrong vs Correct (`fill-parent`)

### Wrong (parent unconstrained)

```tsx
<div className="flex flex-col">
  <TRNContainer mode="fill-parent" layout="stack" scroll="y">...</TRNContainer>
</div>
```

### Correct (parent constrained)

```tsx
<div className="h-[400px] min-h-0 flex flex-col">
  <TRNContainer mode="fill-parent" layout="stack" scroll="y">...</TRNContainer>
</div>
```
