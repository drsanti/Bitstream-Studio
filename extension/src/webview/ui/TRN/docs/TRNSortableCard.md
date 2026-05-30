# TRNSortableCard User Manual

`TRNSortableCard` is a convenience component that composes:

- `TRNSortableItem` (drag/reorder behavior)
- `TRNCard` (card UI + optional collapse)
- `TRNDragHandle` (optional handle)

Use it when you want draggable cards with minimal wiring.

---

## 1) Overview

`TRNSortableCard` helps you avoid manual composition boilerplate.

It supports:

- drag/reorder with `id`
- drag effect presets (`dragFx`)
- optional handle position control
- all normal `TRNCard` behaviors (including collapse/expand)

---

## 2) Props

Extends `TRNCard` props (except internal right-slot handling), plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | - | Sortable item id (required) |
| `sortableClassName` | `string` | `""` | Class for sortable wrapper |
| `dragFx` | `"none" \| "lift" \| "tilt" \| "playful"` | `"tilt"` | Drag visual preset |
| `sortableDisabled` | `boolean` | `false` | Disable drag behavior |
| `handlePosition` | `"left" \| "right" \| "none"` | `"left"` | Position of drag handle |
| `customRightSlot` | `ReactNode` | `undefined` | Extra content on card right slot |

All card behaviors still apply, for example:

- `collapsible`
- `mode`
- `defaultExpanded`
- `expanded`
- `onExpandedChange`

---

## 3) Quick Start

```tsx
<TRNSortableCard
  id="cpu-card"
  title="CPU"
  mode="animated"
  collapsible
  defaultExpanded={false}
>
  <div className="text-xs">CPU content</div>
</TRNSortableCard>
```

---

## 4) Handle Position Examples

### A) Left handle (default)

```tsx
<TRNSortableCard id="left" title="Left Handle" handlePosition="left" />
```

### B) Right handle

```tsx
<TRNSortableCard
  id="right"
  title="Right Handle"
  handlePosition="right"
  customRightSlot={<span className="text-xs text-[var(--muted)]">meta</span>}
/>
```

### C) No handle

```tsx
<TRNSortableCard id="none" title="No Handle" handlePosition="none" />
```

---

## 5) Typical Container Usage

```tsx
<TRNSortableContainer
  itemIds={ids}
  layout="vertical"
  className="flex flex-col gap-2"
  onReorder={setIds}
>
  {ids.map((id) => (
    <TRNSortableCard
      key={id}
      id={id}
      title={`Card ${id}`}
      handlePosition="left"
      dragFx="tilt"
    >
      <div className="text-xs">Body</div>
    </TRNSortableCard>
  ))}
</TRNSortableContainer>
```

---

## 6) Troubleshooting

### Chevron collapse icon does not show

- ensure `collapsible` is not `false`
- if demonstrating both states, include mixed examples (`true` and `false`)

### Handle appears in wrong place

- verify `handlePosition` (`left`, `right`, `none`)

### Custom right content disappears

- pass it via `customRightSlot`, not `rightSlot`

---

## 7) Related Files

- `../TRNSortableCard.tsx`
- `../TRNCard.tsx`
- `../TRNDragHandle.tsx`
- `../examples/TRNSortableCardExample.tsx`
