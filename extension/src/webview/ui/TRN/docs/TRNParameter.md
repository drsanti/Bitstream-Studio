# TRNParameter User Manual

**Source:** `src/webview/ui/TRN/TRNParameter.tsx`

Dense row for **label (+ optional icon)** → **optional gauge** → **value (+ optional unit)**. Used in Bitstream sensor telemetry, Diagnostics Snapshot grid, and toolbars.

---

## 1. Layout

### 1.1 Columns (left to right)

| Region | Notes |
|--------|--------|
| **Name** | `name` (ReactNode). Width: `nameColumnLayout` — `fixed` (60px) or `auto` (grows, `max-w-[50%]`). |
| **Gauge** | Optional `gauge` ReactNode. When present, wrapper is `flex-1 min-w-0` so the bar uses space between label and value block. |
| **Value + unit** | Controlled by `valueColumnLayout` and optional width props (see below). |

### 1.2 `valueColumnLayout`

| Value | Behavior |
|-------|----------|
| **`fixed`** (default) | Value + unit sit in a **100px**-wide block (legacy dense toolbars). |
| **`auto`** | Value + unit use a flex row; with a gauge, the value block competes for width unless `valueTextColumnClassName` is set (see §1.3). |

### 1.3 `valueTextColumnClassName` (with `valueColumnLayout="auto"`)

When this prop is a **non-empty** class string (e.g. `w-[7ch]`):

- The **numeric** `<span>` gets that width and `shrink-0` (no longer `flex-1`).
- The **value+unit** outer div becomes **`shrink-0`** so it does **not** share `flex-1` with the gauge.
- The **gauge** is the only `flex-1` region → **stable bar width** and **right-aligned numbers** that line up across rows in a card.
- The main row **drops `justify-between`** when this mode is active *and* a gauge exists, so `flex-1` on the gauge lays out predictably.

**`ch` unit:** CSS `ch` = width of the `0` glyph in the current font. With `tabular-nums`, column widths track digit width. Example: `w-[7ch]` ≈ seven “0”-widths for the value cell.

### 1.4 `unitColumnClassName`

Fixed width for the **unit** cell when `unit` is set. Default in `TRNParameter` is `w-4`; **sensor rows** override (e.g. `w-8`) so labels like `rad/s` or `m/s²` do not overlap the value.

### 1.5 `positiveSignMode`

- **`always`:** positive numbers get a `+` prefix when formatted.
- **`omit`:** no `+` (typical for unsigned sensor magnitudes).

### 1.6 `appearance` (row chrome + default tones)

| Value | Row chrome | Default label / value / unit / icon (via wrapper) |
|--------|------------|------------------------------------------------------|
| **`card`** (default) | Bordered, `text-xs`, padded inset | Label: no wrapper tone (parent sets). Value: `text-zinc-100`. Unit: `text-zinc-300`. Icon: `text-zinc-400`. |
| **`ghost`** | No border, no background, `text-[11px] leading-snug`, no horizontal padding | Label wrapper: `text-zinc-400` (child elements with their own `className` still override). Value: `text-zinc-50`. Unit: `text-zinc-500`. Icon: `text-zinc-500`. |
| **`divider`** | Like **ghost** plus a **bottom** border line (`border-zinc-800/75`) | Same tone mapping as **ghost**. Use `className="border-b-0"` on the **last** row if the list should not end with a line. |

`className` is still merged onto the row and can override (e.g. `border-b-0`).

---

## 2. Optional icon pulse (`iconPulseOnValueChange`)

When `true` and `icon` is set, a short **GSAP** animation runs on the **icon wrapper** (the `ref`’d `div` around the icon) when the **pulse key** changes.

### 2.1 What triggers a pulse

- By default, the key is derived from the **displayed value** (after `positiveSignMode` formatting).
- Use **`iconPulseTriggerKey`** to drive pulses from a different source (e.g. raw sample string) so in-row number tweens do not re-pulse every frame.

### 2.2 Motion and color (implementation summary)

- **Scale** to **1.12**, small **rotation** wiggle, then back to **scale 1** / **rotation 0**.
- **Color:** tween along **fixed hue** (green accent ~ hue 142) from **neutral gray** at the same hue (`hsl(142, 0%, L%)`) to saturated green — avoids RGB hue paths that read as pink/magenta.
- **Throttle:** new pulses cannot start more often than **~280 ms** apart (`ICON_PULSE_THROTTLE_MS`), except when blocked by an in-flight tween (see below).
- **`prefers-reduced-motion: reduce`:** pulse is skipped.

### 2.3 No interrupt / no stacked pulses

- While **`gsap.isTweening(iconElement)`**, a new change **does not** start another timeline; the **internal prev key** still advances so state stays consistent.
- **Critical:** pulse logic lives in **two** `useLayoutEffect` hooks:
  1. **Cleanup kills tweens** only when pulse is disabled, icon removed, or unmount — **not** on every value (`key`) tick.
  2. **Pulse start** depends on `key` without returning a cleanup that kills tweens on each key change (otherwise fast telemetry intervals would abort the animation).

Effect deps use **`iconPresent` (`icon != null`)** instead of **`icon` identity** so a new React element every render does not constantly kill tweens.

### 2.4 Restoring icon color after pulse

- If **`iconSlotStyle.color`** is set, **`iconRestColor`** restores it after the tween (tooltip/`text-inherit` safety).
- If there is **no** slot color (BMI270-style tint via **`text-*` on the Lucide icon** only), rest clears inline `color` on the wrapper.

---

## 3. Bitstream usage (reference)

| Consumer | Pattern |
|----------|---------|
| **`SensorMetricRow`** | `valueColumnLayout="auto"`, `valueTextColumnClassName="w-[7ch]"`, `unitColumnClassName="w-8"`, `iconPulseOnValueChange`, `iconPulseTriggerKey={value}`. Default: **`iconSlotStyle={{ color: fillColor }}`** + `[&_svg]:text-current`. With **`iconColorOnIcon`**, matches BMI270: **no** slot style; axis tint on the icon via Tailwind classes (BMM350). |
| **`Bmi270AnimatedParameter`** | Same layout props as above; icon color via **`colorClassName`** on `<Activity />`; no `iconSlotStyle`. |
| **`DiagSnapshotCard`** | `TRNParameter` rows with `nameColumnLayout="auto"`, `valueColumnLayout="auto"`; icon pulse on value change; **no** fixed `ch` width (grid layout). |

See also:

- `../../../bitstream-app/docs/SENSOR_DECK_VIEWER_CONVENTIONS.md`
- `../../../bitstream-app/docs/DIAGNOSTICS_SNAPSHOT_UI.md`

---

## 4. Barrel exports

Types: `TRNParameterNameColumnLayout`, `TRNParameterValueColumnLayout`, `TRNParameterPositiveSignMode` from `@/ui/TRN` / `TRNParameter.tsx`.
