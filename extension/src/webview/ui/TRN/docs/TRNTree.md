# TRNTree User Manual

`TRNTree` renders a nested, expandable list from a simple `TRNTreeNode` tree.

## Features

- Expand/collapse per node (chevron)
- Uncontrolled: `defaultExpanded` as id list, or `null` for all collapsed
- Controlled: `expanded` as `Set<string>` of expanded ids + `onExpandedChange`
- Optional `renderLabel` and `renderActions` per node

## Quick start

```tsx
import { TRNTree, type TRNTreeNode } from "@/components/ui/TRN";

const data: TRNTreeNode[] = [
  { id: "1", label: "Root" },
  {
    id: "2",
    label: "Group",
    children: [
      { id: "2a", label: "Child" },
    ],
  },
];

<TRNTree data={data} defaultExpanded={["2"]} />;
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `TRNTreeNode[]` | - | Tree roots. |
| `defaultExpanded` | `readonly string[] \| null` | `null` | Initial expanded ids; `null` = all collapsed. |
| `expanded` | `ReadonlySet<string> \| null` | - | Controlled set of expanded node ids. |
| `onExpandedChange` | `(Set<string>) => void` | - | Fires when expansion changes. |
| `className` | `string` | - | Root class. |
| `itemClassName` | `string` | - | Per-row wrapper. |
| `renderLabel` | `(node) => ReactNode` | - | Replace default label. |
| `renderActions` | `(node) => ReactNode` | - | Trailing content after label. |

`TRNTreeNode`: `id`, `label`, optional `children`, `disabled`.

## Examples

See `../examples/TRNTreeExample.tsx` and the Example Catalog.
