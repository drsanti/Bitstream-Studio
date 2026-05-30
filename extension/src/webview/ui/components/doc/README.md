# Webview UI components (documentation)

This folder holds **human-oriented docs** for reusable components under
[`t3d-extension/src/webview/ui/components/`](../).

They are meant for **future contributors** and **AI agents**: props, behavior, and integration notes that are not obvious from code alone.

## Index

| Document | Component / topic |
|----------|-------------------|
| [DraggableGlassModal.md](./DraggableGlassModal.md) | Draggable, resizable glass modal (`draggable-glass-modal/`) |

## Conventions

- One markdown file per **named reusable** when the API or UX is non-trivial.
- Prefer examples that compile in this repo (import paths, `@/` alias where used).
- When adding a new documented component, add a row to the table above.

## Related code

- Barrel exports: [`../index.ts`](../index.ts)
- Styling: Tailwind CSS (see webview `app.css` and `tailwind.config.mjs` at extension root)
