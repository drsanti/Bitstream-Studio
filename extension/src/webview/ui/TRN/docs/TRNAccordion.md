# TRNAccordion User Manual

`TRNAccordion` is an animated disclosure component for grouped sections.

It supports:

- single-open or multiple-open behavior
- controlled and uncontrolled value state
- disabled items
- animation tuning (`durationMs`, `easing`, `animateOpacity`)

---

## 1) Core Components

- `TRNAccordion`
- `TRNAccordionItem`
- `TRNAccordionTrigger`
- `TRNAccordionContent`

---

## 2) Quick Start

```tsx
import {
  TRNAccordion,
  TRNAccordionItem,
  TRNAccordionTrigger,
  TRNAccordionContent,
} from "@/components/ui/TRN/TRNAccordion";

<TRNAccordion type="single" defaultValue="item-1">
  <TRNAccordionItem value="item-1">
    <TRNAccordionTrigger>Section A</TRNAccordionTrigger>
    <TRNAccordionContent>Section A content.</TRNAccordionContent>
  </TRNAccordionItem>
  <TRNAccordionItem value="item-2">
    <TRNAccordionTrigger>Section B</TRNAccordionTrigger>
    <TRNAccordionContent>Section B content.</TRNAccordionContent>
  </TRNAccordionItem>
</TRNAccordion>;
```

---

## 3) Props (TRNAccordion)

| Prop | Type | Default | Description |
|---|---|---|---|
| `type` | `"single" \| "multiple"` | `"single"` | Open behavior mode |
| `value` | `string \| string[] \| undefined` | `undefined` | Controlled state |
| `defaultValue` | `string \| string[] \| undefined` | `undefined` | Uncontrolled initial state |
| `onValueChange` | `(next) => void` | `undefined` | Value change callback |
| `collapsible` | `boolean` | `true` | Allow closing active item(s) |
| `animated` | `boolean` | `true` | Enable max-height animation |
| `durationMs` | `number` | `220` | Transition duration |
| `easing` | `string` | `cubic-bezier(0.22, 1, 0.36, 1)` | Transition easing |
| `animateOpacity` | `boolean` | `true` | Fade content while animating |
| `className` | `string` | `""` | Root class override |

## 4) Props (TRNAccordionItem)

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | - | Unique item id |
| `disabled` | `boolean` | `false` | Disable trigger interactions |
| `className` | `string` | `""` | Item wrapper class |

---

## 5) Usage Patterns

### A) Multiple open items

```tsx
<TRNAccordion type="multiple" defaultValue={["cpu", "network"]}>
  ...
</TRNAccordion>
```

### B) Controlled mode

```tsx
const [value, setValue] = useState<string | undefined>("a");

<TRNAccordion type="single" value={value} onValueChange={(next) => setValue(typeof next === "string" ? next : undefined)}>
  ...
</TRNAccordion>;
```

### C) Animation tuning

```tsx
<TRNAccordion
  type="multiple"
  durationMs={420}
  easing="cubic-bezier(0.16, 1, 0.3, 1)"
  animateOpacity={false}
>
  ...
</TRNAccordion>
```

---

## 6) Troubleshooting

### Item does not open

- verify each `TRNAccordionItem` has a unique `value`
- check `disabled` is not set on that item

### Controlled value not updating

- pass matching `value` type for selected `type`
  - `single`: string/undefined
  - `multiple`: string[]

### Animation feels too slow or too fast

- tune `durationMs` and `easing`
- disable `animateOpacity` for snappier feel

---

## 7) Related Files

- `../TRNAccordion.tsx`
- `../examples/TRNAccordionExample.tsx`
- `../examples/exampleRegistry.ts`
