# Workbench layout dialogs (Save / Manage)

**Code:** `WorkbenchSaveLayoutDialog.tsx`, `WorkbenchLayoutLibraryPanel.tsx`, shared chrome in `workbench-layout-dialog-chrome.ts`.

## UX pattern

Both dialogs use **`TRNWindow`** as **centered glass modals** (not draggable floaters):

| Property | Value |
| -------- | ----- |
| `modal` | `true` |
| `modalBackdropCloses` | `false` (dismiss via **Cancel** or header **×**) |
| `draggable` / `resizable` | `false` |
| `showMaximize` / `showFooter` | `false` |
| `glass` + `glassPreset` | `"medium"` |
| Close wiring | **`onClose`** → parent `onOpenChange(false)` (not `onOpenChange` on `TRNWindow`) |

Geometry is computed with **`computeCenteredWorkbenchDialogRect(width, height)`** on open (`useLayoutEffect`).

## Save layout

- **Title:** Save layout · prefix icon `LayoutTemplate`
- **Body:** snapshot card (pane summary, named-layout meter `n / 12`), required name field, compact footer actions
- **Overwrite:** `TRNMessageDialog` (warning) when name conflicts

Entry: **Layout ▾** → **Save current layout as…** (Sensor Studio, Sensor Telemetry).

## Manage layouts

- **Title:** Manage layouts · prefix icon `LayoutGrid`
- **Body:** startup `TRNSelect` + active label + saved count; scrollable list with **Startup** badge on the active named row; per-row **Load** + icon actions (`TRNButton` **`hint`** — no native `title`)
- **Rename:** secondary centered modal (same chrome, `Pencil` prefix)
- **Delete:** `TRNMessageDialog` (danger primary)

Entry: **Layout ▾** → **Manage layouts…**

## Related

- Persistence and API: `workbench-layout-library.ts`, tests `workbench-layout-library.test.ts`
- Tracker: `extension/docs/DEVELOPMENT_TRACKER.md` (TRN workbench layout library phases)
