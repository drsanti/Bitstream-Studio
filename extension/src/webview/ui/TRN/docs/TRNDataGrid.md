# TRNDataGrid User Manual

`TRNDataGrid` is a themed table with optional client-side sorting and column resize by dragging the header edge.

## Features

- Sticky header (configurable)
- `getValue` + `sortable` for string/number/boolean client sort
- Custom `cell` render
- `resizableColumns` and per-column `width` (px)

## Quick start

```tsx
import { TRNDataGrid } from "@/components/ui/TRN";

type Row = { id: string; name: string; count: number };

<TRNDataGrid<Row>
  getRowId={(r) => r.id}
  rows={rows}
  columns={[
    { id: "name", label: "Name", sortable: true, getValue: (r) => r.name },
    { id: "count", label: "Count", sortable: true, getValue: (r) => r.count },
  ]}
  resizableColumns
/>;
```

## Key props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | `TRNDataGridColumn<TRow>[]` | - | Column definitions. |
| `rows` | `TRow[]` | - | Row data. |
| `getRowId` | `(row, index) => string` | - | Stable id for row keys. |
| `stickyHeader` | `boolean` | `true` | Sticky table header. |
| `resizableColumns` | `boolean` | `false` | Drag right edge of header to resize. |
| `defaultSortColumnId` | `string` | - | Initial sort column. |
| `defaultSortDirection` | `TRNDataGridSortDirection` | `null` | `asc` / `desc` / `null`. |
| `onSortChange` | `(columnId, direction) => void` | - | Fires when user changes sort. |

`TRNDataGridColumn<TRow>`: `id`, `label`, optional `sortable`, `width`, `getValue`, `cell`, and className hooks.

## Examples

See `../examples/TRNDataGridExample.tsx` and the Example Catalog.
