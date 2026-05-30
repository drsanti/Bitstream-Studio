# TRNSortable User Manual

This guide covers the generic sortable primitives:

- `TRNSortableContainer`
- `TRNSortableItem`
- `TRNDragHandle`

Use these when you want drag-to-reorder behavior in any layout (list, row, grid), not only dashboards.

---

## 1) Overview

`TRNSortable` primitives provide:

- reorder context with `@dnd-kit`
- pointer + keyboard sensors
- sortable wrappers with transform/transition handling
- optional drag visual presets (`dragFx`)
- optional dedicated drag handle

---

## 2) Core Components

### `TRNSortableContainer`

Provides `DndContext` + `SortableContext`.

Key props:

- `itemIds: string[]`
- `onReorder: (nextItemIds: string[]) => void`
- `layout?: "vertical" | "horizontal" | "grid"`
- standard container props (`className`, etc.)

### `TRNSortableItem`

Wraps one sortable element.

Key props:

- `id: string`
- `disabled?: boolean`
- `dragFx?: "none" | "lift" | "tilt" | "playful"`
- `dragFxOptions?: { normalizeScale?, liftScale?, tiltScale?, playfulScale?, tiltMaxRotateDeg?, playfulMaxRotateDeg? }`

### `TRNDragHandle`

Optional drag activator for handle-only dragging.

Key props:

- supports native button props
- `hideIcon?: boolean`

---

## 3) Quick Start

```tsx
import { useMemo, useState } from "react";
import { TRNSortableContainer } from "@/components/ui/TRN/TRNSortableContainer";
import { TRNSortableItem } from "@/components/ui/TRN/TRNSortableItem";
import { TRNDragHandle } from "@/components/ui/TRN/TRNDragHandle";
import { TRNCard } from "@/components/ui/TRN/TRNCard";

type Item = { id: string; title: string };

const seed: Item[] = [
  { id: "a", title: "Alpha" },
  { id: "b", title: "Beta" },
  { id: "c", title: "Gamma" },
];

export function Example() {
  const [items, setItems] = useState(seed);
  const itemIds = useMemo(() => items.map((i) => i.id), [items]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  return (
    <TRNSortableContainer
      itemIds={itemIds}
      layout="vertical"
      className="flex flex-col gap-2"
      onReorder={(nextIds) => {
        setItems(nextIds.map((id) => byId.get(id)).filter((v): v is Item => v != null));
      }}
    >
      {itemIds.map((id) => {
        const item = byId.get(id);
        if (item == null) return null;
        return (
          <TRNSortableItem key={item.id} id={item.id} dragFx="tilt">
            <TRNCard title={item.title} mode="simple" collapsible={false} rightSlot={<TRNDragHandle />}>
              <div className="text-xs">Drag by handle</div>
            </TRNCard>
          </TRNSortableItem>
        );
      })}
    </TRNSortableContainer>
  );
}
```

---

## 4) Layout Strategies

- `vertical`
  - best for sidebar and stack panels
- `horizontal`
  - best for reorderable rows/chips
- `grid`
  - best for dashboard-like card groups

---

## 5) Drag Visual Presets (`dragFx`)

On `TRNSortableItem`:

- `none` — no extra visual effect
- `lift` — subtle scale + shadow
- `tilt` — scale + directional tilt + shadow
- `playful` — stronger tilt + shadow (scale is configurable via `dragFxOptions.playfulScale`)

### `dragFxOptions` tuning

Use this when cards have different heights/widths and you want to avoid stretch/zoom artifacts while dragging.

- `normalizeScale` (default: `true`)
  - forces transform scale to `1` while sorting to prevent size distortion
- `liftScale` (default: `1.02`)
- `tiltScale` (default: `1.03`)
- `playfulScale` (default: `1.0`)
- `tiltMaxRotateDeg` (default: `3.5`)
- `playfulMaxRotateDeg` (default: `5.0`)

Example:

```tsx
<TRNSortableItem
  id={item.id}
  dragFx="playful"
  dragFxOptions={{
    normalizeScale: true,
    playfulScale: 1,
    playfulMaxRotateDeg: 3,
  }}
>
  {content}
</TRNSortableItem>
```

---

## 6) Accessibility Notes

- Keyboard sensor is enabled in `TRNSortableContainer`.
- `TRNDragHandle` uses button semantics (`aria-label`, `title`).
- Keep drag handle visible and reachable in dense UIs.

---

## 7) Troubleshooting

### Items do not reorder

- confirm `itemIds` has unique stable ids
- verify `onReorder` updates parent state

### Drag starts too easily

- current pointer activation uses small distance threshold
- move drag activation to `TRNDragHandle` only

### Visual effects look too strong

- use `dragFx="lift"` or `dragFx="none"` for subtle behavior
- for `playful`, reduce `playfulMaxRotateDeg` and/or keep `playfulScale: 1`

---

## 8) Related Files

- `../TRNSortableContainer.tsx`
- `../TRNSortableItem.tsx`
- `../TRNDragHandle.tsx`
- `../examples/TRNSortableExample.tsx`
