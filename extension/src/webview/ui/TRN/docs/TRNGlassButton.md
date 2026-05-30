# TRNGlassButton User Manual

`TRNGlassButton` is the TRN-facing wrapper for legacy glass button visuals.
Use it for migration and for new glass-style controls that should stay aligned with TRN naming.

## Import

```ts
import { TRNGlassButton } from "../index.js";
```

## Props

- `tone?: "neutral" | "info" | "danger" | "success" | "warning" | "accent"`
- `color?: "gray" | "blue" | "red" | "emerald" | "amber" | "violet"`
- `trnSize?: "compact" | "default" | "control"`
- Legacy `size` is still supported for compatibility (`"sm" | "md" | "control"`).
- All standard button attributes are supported.

## Priority Rules

- If both `color` and `tone` are provided, `color` wins.
- If both `trnSize` and legacy `size` are provided, `trnSize` wins.

## Examples

```tsx
<TRNGlassButton tone="success" trnSize="control">
  Connect
</TRNGlassButton>
```

```tsx
<TRNGlassButton color="amber" size="sm">
  Warning
</TRNGlassButton>
```

## Migration Notes

- Prefer `tone` + `trnSize` for new code.
- Existing `GlassButton` usage can migrate mechanically:
  - `GlassButton` -> `TRNGlassButton`
  - Keep `color`/`size` first (no behavior change)
  - Optionally convert to `tone`/`trnSize` later

## Legacy Cleanup Checklist

- Migrate remaining feature usage from `GlassButton` / `GlassIconButton` to TRN primitives.
- Keep legacy exports only for backward compatibility while migration is in progress.
- Remove legacy exports from `ui/components/common/index.ts` only after no runtime usage remains.
