# TRNForm Primitives User Manual

This module provides small, theme-aware building blocks: section chrome, a labeled field row, and inline text editing.

## Components

- `TRNFormSection` — title, optional `description` (hover tooltip on title), `showHeading`, child fields
- `TRNFormField` — label, optional `required`, `error`, `hint` (hover tooltip on label), wraps any control
- `TRNInlineEdit` — read view with pencil; commit/cancel; optional `validate` and `multiline`
- `TRNInput` / `TRNInputGroup` — prefix-icon text rows (see `TRNInput.md`)

## Quick start

```tsx
import { TRNFormField, TRNFormSection, TRNInlineEdit } from "@/components/ui/TRN";

<TRNFormSection title="Device" description="Read-only in this example.">
  <TRNFormField label="Name" htmlFor="name">
    <TRNInlineEdit
      defaultValue="Sensor A"
      onCommit={(next) => setName(next)}
    />
  </TRNFormField>
</TRNFormSection>;
```

## TRNInlineEdit

| Prop | Type | Description |
| --- | --- | --- |
| `value` / `defaultValue` | `string` | Controlled vs uncontrolled. |
| `onCommit` | `(next: string) => void` | Save. |
| `onCancel` | `() => void` | Optional cancel. |
| `validate` | `(v) => true \| string` | String return = error, blocks commit. |
| `multiline` | `boolean` | Uses textarea. |
| `disabled` | `boolean` | Read-only. |

## Examples

See `../examples/TRNFormExample.tsx` and the Example Catalog.
