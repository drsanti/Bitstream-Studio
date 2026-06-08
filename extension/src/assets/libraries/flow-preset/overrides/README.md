# Official flow preset overrides (maintainer)

Hand-tuned `trn-flow-preset` files in this folder **replace** auto-generated exports for the same filename when you run `npm run flow-preset:gen`.

## Workflow

1. In dev, enable **Maintainer mode** on Library → Presets → Flows.
2. Load an **Official** preset → **Replace**, fine-tune on the canvas.
3. Click the **Override** icon on that Official row — in **Vite dev** this saves directly into this folder (confirm dialog).
   - Or use **Import override file…** in Maintainer tools to browse to a downloaded JSON.
   - CLI alternative: `npm run flow-preset:apply-override -- signal-chain path/to/file.json`
4. Click **Regenerate bundled** in Maintainer tools (or `npm run flow-preset:gen`).
5. Reload dev and verify under **Official**.

6. Publish when ready (`flow-preset:stage-free-pack` or `flow-preset:publish-free-pack`).

Keep **`official-{templateId}`** ids and `{templateId}.trn-flow-preset.json` filenames stable.
