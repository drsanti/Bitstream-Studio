# TRNCard User Manual

`TRNCard` is a collapsible card component with two modes:

- `simple` (instant expand/collapse)
- `animated` (measured height transition)

It is designed for compact panel sections where the header stays visible and the body can be toggled.

---

## 1) Overview

Use `TRNCard` when you need:

- icon + title header bar
- collapse/expand toggle icon
- controlled or uncontrolled expanded state
- optional measured animation tuning

---

## 2) Quick Start

```tsx
import { TRNCard } from "@/components/ui/TRN/TRNCard";
import { Gauge } from "lucide-react";

export function Example() {
  return (
    <TRNCard title="System Stats" icon={<Gauge className="h-4 w-4" />}>
      <div>Card content</div>
    </TRNCard>
  );
}
```

---

## 3) Core Concepts

- **Mode**
  - `simple`: render/hide body immediately
  - `animated`: animate `max-height` (with optional opacity)
- **State**
  - uncontrolled: `defaultExpanded`
  - controlled: `expanded` + `onExpandedChange`
- **Header interaction**
  - click title row (`toggleOnHeaderClick`)
  - click chevron button

---

## 4) Props Reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | - | Header title |
| `icon` | `ReactNode` | `undefined` | Optional left icon |
| `children` | `ReactNode` | - | Card body content |
| `mode` | `"simple" \| "animated"` | `"simple"` | Collapse behavior mode |
| `expanded` | `boolean` | `undefined` | Controlled expanded state |
| `defaultExpanded` | `boolean` | `true` | Initial uncontrolled state |
| `onExpandedChange` | `(next: boolean) => void` | `undefined` | State change callback |
| `collapsible` | `boolean` | `true` | Show/hide toggle behavior |
| `disabled` | `boolean` | `false` | Disable interactions |
| `durationMs` | `number` | `220` | Animation duration (animated mode) |
| `easing` | `string` | `cubic-bezier(0.22, 1, 0.36, 1)` | Transition easing |
| `animateOpacity` | `boolean` | `true` | Opacity transition in animated mode |
| `collapsedHeight` | `number` | `0` | Collapsed max-height baseline |
| `rightSlot` | `ReactNode` | `undefined` | Optional header actions area |
| `headerClassName` | `string` | `""` | Extra class for header row |
| `contentClassName` | `string` | `""` | Extra class for content wrapper |
| `toggleOnHeaderClick` | `boolean` | `true` | Allow title-row click toggle |
| `className` | `string` | `""` | Extra class for card root |
| `...divProps` | `HTMLAttributes<HTMLDivElement>` | - | Native root div attributes |

---

## 5) Common Patterns

### A) Simple mode

```tsx
<TRNCard title="Simple card" mode="simple">
  <div className="text-xs">No height animation.</div>
</TRNCard>
```

### B) Animated mode with tuning

```tsx
<TRNCard
  title="Animated card"
  mode="animated"
  durationMs={260}
  easing="cubic-bezier(0.22, 1, 0.36, 1)"
  animateOpacity
>
  <div className="text-xs">Measured max-height animation.</div>
</TRNCard>
```

### C) Controlled state

```tsx
const [open, setOpen] = useState(true);

<TRNCard
  title="Controlled card"
  mode="animated"
  expanded={open}
  onExpandedChange={setOpen}
>
  <div>Parent manages expanded state.</div>
</TRNCard>
```

---

## 6) Accessibility

- Header toggle exposes `aria-expanded`
- Toggle button has explicit labels:
  - `Collapse card`
  - `Expand card`
- For non-collapsible sections, set `collapsible={false}`

---

## 7) Troubleshooting

### Card content does not animate

- Ensure `mode="animated"` is set.
- Verify body content is present and not conditionally removed outside `TRNCard`.

### Expanded state looks out of sync

- Use either:
  - uncontrolled (`defaultExpanded` only), or
  - controlled (`expanded` + `onExpandedChange`)
- Avoid mixing both patterns unintentionally.

### Header should not toggle on title click

- Set `toggleOnHeaderClick={false}`.
- Users can still toggle with the chevron button (if `collapsible`).

---

## 8) Related Files

- Component: `../TRNCard.tsx`
- Example page: `../examples/TRNCardExample.tsx`
- Registry: `../examples/exampleRegistry.ts`
