# TRNInput User Manual

Borderless text fields with **prefix icon chrome** (Wi‑Fi Connect style). Pair with `TRNInputGroup` for stacked SSID/password rows and `TRNFormField` when you need a visible label.

## Components

- `TRNInput` — single row: optional prefix, native `<input>`, optional suffix or password reveal
- `TRNInputGroup` — shared outer shell + dividers between child inputs

## Quick start

```tsx
import { TRNFormField, TRNInput, TRNInputGroup } from "@/ui/TRN";
import { KeyRound, Wifi } from "lucide-react";

<TRNInputGroup>
  <TRNInput
    prefixIcon={Wifi}
    value={ssid}
    onChange={(e) => setSsid(e.target.value)}
    placeholder="Your Wi‑Fi name"
    aria-label="Network name"
  />
  <TRNInput
    prefixIcon={KeyRound}
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Password"
    aria-label="Password"
  />
</TRNInputGroup>;

<TRNFormField label="Host" htmlFor="host">
  <TRNInput id="host" prefixIcon={Wifi} variant="outlined" value={host} onChange={...} />
</TRNFormField>;
```

## TRNInput

| Prop | Default | Description |
| --- | --- | --- |
| `prefixIcon` | — | `LucideIcon` or `ReactNode` |
| `suffix` | — | Trailing slot; disables built-in password toggle |
| `showPasswordToggle` | `true` when `type="password"` | Set `false` to hide Eye toggle |
| `variant` | `ghost` | `ghost` (row highlight) or `outlined` (border on row) |
| `size` | `sm` | `sm` → `text-xs`, ~28px row |
| `invalid` | `false` | Rose border tint + `aria-invalid` |
| `className` | — | Row chrome |
| `inputClassName` | — | Native input |

Supports `forwardRef` to the underlying `<input>`.

## TRNInputGroup

Wraps any number of children (typically `TRNInput`). Inserts horizontal dividers between rows.

## Examples

See `../examples/TRNFormExample.tsx` tab **Prefix input**.
