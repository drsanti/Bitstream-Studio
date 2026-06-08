# Bitstream Presentation (legacy folder)

**Active implementation:** `extension/src/webview/presentation/` — third workspace in Bitstream Studio.

This folder keeps the **v0 standalone Vite app** and planning docs. Do not import from here in the extension.

## Development plan

See **[`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md)** and **[`../extension/src/webview/presentation/docs/INTEGRATION.md`](../extension/src/webview/presentation/docs/INTEGRATION.md)**.

## Quick start (integrated app)

```bash
cd extension
npm run start:bridge    # terminal 1
npm run dev:webview     # terminal 2
```

Open `http://localhost:5173/?workspace=presentation` or use the **Presentation** toolbar tab.

VS Code: **Open Presentation** command opens a second editor column.

## Themes

Light and dark presentation themes — toggle in the presentation top bar (scoped CSS variables).
