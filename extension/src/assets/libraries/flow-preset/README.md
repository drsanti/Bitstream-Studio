# Official flow presets (bundled)

Built-in Sensor Studio demo templates exported as `trn-flow-preset` files for the **Saved → Flows → Official** library.

## Regenerate

From `extension/`:

```bash
npm run flow-preset:gen
```

This runs `runDemoTemplate` for each Canvas Inspector starter graph and writes:

- `index.json` — remote index consumed by `libraries/flow-preset/index.json` on the online asset pack
- `*.trn-flow-preset.json` — one file per demo template id

## Dev / VSIX

Vite serves these under `/__extension_src_assets/libraries/flow-preset/` and copies them to `out/webview/assets/libraries/flow-preset/` on build.
