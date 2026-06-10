---
name: webview-ui-elements
description: >-
  Pick and implement TRN webview controls (toggles, numerics, selects, text,
  emoji, cards, portaled menus). Use BEFORE creating or editing any UI under
  extension/src/webview — inspector fields, toolbars, maintainer panels, Course
  Studio cards, Sensor Studio settings, Bitstream forms.
---

# Webview UI elements (TRN)

## Mandatory — read before new UI

When you **add or change** UI under **`extension/src/webview/**`**:

1. Read rule **`trn-webview-control-picker.mdc`** (control matrix).
2. Open a **sibling file** in the same app/panel and copy its row pattern.
3. Run the **checklist** below before finishing.

---

## Control checklist

Copy and complete:

```
Webview UI checklist:
- [ ] Sibling panel identified (path: ___)
- [ ] Control type matches matrix (not native select/checkbox/number)
- [ ] Labels/hints use TRN patterns (no HTML title)
- [ ] Card sections collapsible + meaningful Lucide titleIcon (if applicable)
- [ ] Scrollable menus use scrollbar-hide (trn-glass-dropdown-scrollbars.mdc)
- [ ] Menus with >5 items use search shell (trn-menu-search.mdc)
- [ ] Popovers/menus portaled if inside overflow scroll panes
- [ ] Value typography matches siblings (13px select/scrub in maintainer rows)
- [ ] No tabular-nums / font-mono unless user asked
```

---

## By app

### Course Studio maintainer (`course-studio/maintainer/`)

| Pattern | Component / path |
|---------|------------------|
| Inspector card | **`CourseInspectorCard`** — multi-topic blocks split into cards (e.g. Header / Header animation / Body / Colors) |
| Label + text + emoji | **`CourseEmojiTextField`** |
| Label + select | **`TRNFormField`** + **`TRNSelect`** (`variant="field"` `size="sm"`) |
| Label + numeric (reset/step) | **`TRNFormField`** + **`CourseMaintainerScrubNumberField`** — do **not** import **`TRNScrubNumberField`** directly |
| Label + numeric (bare scrub) | **`TRNFormField`** + **`CourseMaintainerScrubNumberInput`** — do **not** import **`TRNScrubNumberInput`** directly |
| Scrub presets (wrappers only) | **`courseScrubFieldPresets.ts`** — `COURSE_INSPECTOR_SCRUB_SIZE` (`"field"`), appearance, 13px input class |
| Boolean row | **`TRNInlineToggleRow`** (stacked, one per flag) |
| Prefix icon on titles | **`CourseTitleIconField`**; animation in separate card via **`CourseTitleIconAnimationFields`** |
| Emoji picker | **`TRNEmojiPickerPopover`** (body portal — do not use absolute inside inspector scroll) |

Reference: **`CourseYoutubeBlockInspectorFields.tsx`**, **`CourseCardBlockInspectorFields.tsx`**.

### Sensor Studio inspector (`sensor-studio/.../inspector/`)

| Pattern | Component |
|---------|-----------|
| Numeric row | **`InspectorNumericScrubRow`** → **`TRNScrubNumberField`** |
| Boolean in section | **`InspectorCompactToggleRow`** |
| Select row | **`InspectorSelectRow`** + **`TRNSelect`** |
| Section chrome | **`InspectorCollapsibleSection`** |

Full rules: **`extension/src/webview/sensor-studio/docs/SENSOR_STUDIO_NODE_UI_RULES.md`**.

Do **not** use bare **`TRNScrubNumberInput`** directly in Sensor Studio inspector UI.

### Bitstream / Sensor Telemetry

Reuse TRN from **`extension/src/webview/ui/TRN/`**; match sibling panels (`RealtimeUiSettingsForm`, cfg deck). Telemetry cfg uses domain widgets (`SensorCfgDeck`), not one-off controls.

---

## Popovers and z-index

Menus/pickers that open from inspector scroll areas must **portal** to `document.body` with **fixed** layout (see **`TRNSelect`**, **`TRNEmojiPickerPopover`**). Backdrop dismiss + Escape. z-index class **`z-10000`** for stacked overlays.

---

## When TRN is missing

1. Add reusable component under **`extension/src/webview/ui/TRN/`**.
2. Export from **`ui/TRN/index.ts`**.
3. Note in **`ui/TRN/docs/`** if non-trivial.
4. Update **`trn-webview-control-picker.mdc`** if it is a new control category.

---

## Related rules

`trn-ui-consistency.mdc`, `trn-component-first.mdc`, `trn-no-native-tooltip.mdc`, `trn-glass-dropdown-scrollbars.mdc`, `trn-menu-search.mdc`, `no-tabular-font-unless-asked.mdc`
