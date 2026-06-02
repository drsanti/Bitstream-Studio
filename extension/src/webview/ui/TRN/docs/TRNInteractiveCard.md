# TRNInteractiveCard User Manual

`TRNInteractiveCard` is a compact card primitive for panel-style UIs that need:

- custom header slots
- optional collapse/expand behavior
- smooth content height + opacity transitions

It is commonly composed with `TRNSortableContainer`, `TRNSortableItem`, and `TRNDragHandle` for draggable/collapsible dashboards.

---

## 1) Core Props

- `title: ReactNode`
- `titleLeadingSlot?: ReactNode`
- `titleTrailingSlot?: ReactNode`
- `children?: ReactNode`
- `className?: string`
- `headerClassName?: string`
- `headerTitleClassName?: string`
- `contentClassName?: string`

Collapse behavior:

- `collapsible?: boolean`
- `collapsed?: boolean` (controlled mode)
- `defaultCollapsed?: boolean` (uncontrolled mode)
- `onCollapsedChange?: (next: boolean) => void`
- `animationDurationMs?: number` (default `220`)
- `animationEasing?: string` (default `cubic-bezier(0.22, 1, 0.36, 1)`)

---

## 2) Basic Example

```tsx
<TRNInteractiveCard
  title="IMU Temperature"
  titleLeadingSlot={<Thermometer className="h-4 w-4 text-zinc-400" />}
  titleTrailingSlot={<span className="text-[10px] font-semibold text-zinc-400">BMI270</span>}
  shell="solid"
  className="h-auto"
>
  <div className="text-xs text-zinc-300">Card content</div>
</TRNInteractiveCard>
```

---

## 3) Collapsible Example

```tsx
const [collapsed, setCollapsed] = useState(false);

<TRNInteractiveCard
  title="IMU Orientation"
  collapsible
  collapsed={collapsed}
  onCollapsedChange={setCollapsed}
>
  <div className="text-xs text-zinc-300">Quaternion and Euler rows...</div>
</TRNInteractiveCard>;
```

---

## 4) Sortable Composition Example

```tsx
<TRNSortableContainer itemIds={cardIds} onReorder={setCardIds} className="flex flex-col gap-2">
  {cardIds.map((id) => (
    <TRNSortableItem key={id} id={id} dragFx="playful">
      <TRNInteractiveCard
        title={id}
        collapsible
        titleLeadingSlot={<TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0" />}
      >
        {renderCardBody(id)}
      </TRNInteractiveCard>
    </TRNSortableItem>
  ))}
</TRNSortableContainer>
```

---

## 5) Related Components

- `TRNCardHeader` (header primitive used internally by `TRNInteractiveCard`)
- `TRNSortableContainer`
- `TRNSortableItem`
- `TRNDragHandle`
