# TRNTabs User Manual

`TRNTabs` is a customizable tabs primitive for TRN UI, designed to match the same styling and animation behavior as other TRN components.

## Components

- `TRNTabs` — root state container.
- `TRNTabsList` — tab list wrapper (`role="tablist"`).
- `TRNTabsTrigger` — interactive tab button (`role="tab"`).
- `TRNTabsContent` — panel content (`role="tabpanel"`).

## Quick Start

```tsx
<TRNTabs defaultValue="overview">
  <TRNTabsList>
    <TRNTabsTrigger value="overview">Overview</TRNTabsTrigger>
    <TRNTabsTrigger value="metrics">Metrics</TRNTabsTrigger>
  </TRNTabsList>

  <TRNTabsContent value="overview">Overview panel</TRNTabsContent>
  <TRNTabsContent value="metrics">Metrics panel</TRNTabsContent>
</TRNTabs>
```

## Features

- Controlled/uncontrolled state (`value` + `onValueChange` or `defaultValue`).
- Variants:
  - `variant="default"` (classic inline tabs)
  - `variant="rail"` (docked vertical tab rail with rotated labels)
- Active trigger styling:
  - `activePreset="default"` (current TRN dark-style highlight)
  - `activePreset="soft"` (subtle underline-like emphasis)
  - `activeTriggerClassName` for full override
- Keyboard navigation:
  - Horizontal: `ArrowLeft`, `ArrowRight`
  - Vertical: `ArrowUp`, `ArrowDown`
  - Both: `Home`, `End`, `Enter`, `Space`
- Optional lazy mounting (`lazyMount`) for tab panels.
- Optional panel animation controls (`durationMs`, `easing`, `animateOpacity`).

## Rail Variant

Use the rail variant to create a docked side rail similar to “IDE-style” vertical tabs.

```tsx
<TRNTabs defaultValue="tab-2" variant="rail" railSide="right" className="flex gap-0 min-h-0">
  <div className="min-w-0 flex-1 rounded-l-md border border-zinc-700/80 bg-zinc-950/60 p-3">
    <TRNTabsContent value="tab-1">Tab 1 panel</TRNTabsContent>
    <TRNTabsContent value="tab-2">Tab 2 panel</TRNTabsContent>
    <TRNTabsContent value="tab-3">Tab 3 panel</TRNTabsContent>
  </div>

  <TRNTabsList className="-ml-px">
    <TRNTabsTrigger value="tab-1">Tab 1</TRNTabsTrigger>
    <TRNTabsTrigger value="tab-2">Tab 2</TRNTabsTrigger>
    <TRNTabsTrigger value="tab-3">Tab 3</TRNTabsTrigger>
  </TRNTabsList>
</TRNTabs>
```

Notes:

- `variant="rail"` defaults the tabs orientation to `vertical` (you can still override `orientation` if needed).
- `railSide` controls which side of the content the rail is docked to (`"left"` or `"right"`).
- The rail list supports many tabs via vertical scrolling (`overflow-y-auto`).

## Notes

- Use unique `value` for each trigger/content pair.
- For vertical side navigation layouts, set `orientation="vertical"`.
- Keep content lightweight if many tabs switch frequently.
- Prefer `activePreset` for shared visual consistency and use
  `activeTriggerClassName` only for one-off local designs.
