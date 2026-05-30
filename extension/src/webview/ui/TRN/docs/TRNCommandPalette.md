# TRNCommandPalette User Manual

`TRNCommandPalette` is a search-first command list (command palette) with optional grouping and keyboard selection.

## Features

- Text filter (tokenized match against label, group, keywords, id)
- `↑` / `↓` to move, `Enter` to select, `Esc` to close
- Group headers when `group` is set on items
- Optional shortcut hint column

## Quick start

```tsx
import { TRNCommandPalette } from "@/components/ui/TRN";

<TRNCommandPalette
  open={open}
  onClose={() => setOpen(false)}
  onSelect={(id) => console.log(id)}
  items={[
    { id: "a", label: "Action A" },
    { id: "b", label: "Action B", group: "File" },
  ]}
  title="Commands"
/>;
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | - | When false, renders nothing. |
| `onClose` | `() => void` | - | Invoked for Escape and backdrop dismiss patterns. |
| `onSelect` | `(id: string) => void` | - | Fires with item id on Enter / click. |
| `items` | `TRNCommandPaletteItem[]` | - | List of commands. |
| `title` | `string` | (see component) | Header title. |
| `placeholder` | `string` | (see component) | Search input placeholder. |
| `emptyText` | `string` | (see component) | Shown when no item matches. |
| `className` | `string` | - | Root class. |
| `zIndex` | `number` | (see component) | Stack order when not inside a `TRNWindow`. |
| `inputRef` | `RefObject<...>` | - | Optional ref to the search field. |

## `TRNCommandPaletteItem`

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique id passed to `onSelect`. |
| `label` | `string` | Primary line. |
| `group` | `string` | Optional section title. |
| `keywords` | `string` | Extra search text (not shown). |
| `shortcut` | `string` | Shown on the right when set. |
| `disabled` | `boolean` | Excluded from search and selection. |

## Examples

See `../examples/TRNCommandPaletteExample.tsx` and the Example Catalog (Ctrl/Cmd+K) under `TRNCommandPalette`.
