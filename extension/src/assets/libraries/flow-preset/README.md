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

## Publish to online free pack

Local clone (recommended):

```bash
npm run flow-preset:stage-free-pack
# then commit + push in ternion-3d-assets-free (bump assets/feed.json revision)
```

Direct GitHub upload (requires `GITHUB_TOKEN`):

```bash
npm run flow-preset:publish-free-pack
```

Remote path: `assets/libraries/flow-preset/` on `ternion-3d-assets-free` — see `extension/docs/ASSETS_ONLINE_REPO.md`.
