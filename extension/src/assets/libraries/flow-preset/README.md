# Official flow presets (bundled)

Built-in Sensor Studio demo templates exported as `trn-flow-preset` files for the **Presets → Flows → Official** library.

## Maintainer workflow (Vite dev UI)

1. **Maintainer mode** on Library → Presets → Flows.
2. Load **Official** → **Replace**, edit canvas, **Override** icon (saves to `overrides/`).
3. **Regenerate bundled** or **Publish official flows** (regen + stage + optional GitHub upload).

CLI alternatives: `flow-preset:apply-override`, `flow-preset:gen`. See `overrides/README.md`.

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

**UI (Vite dev):** Maintainer tools → **Publish official flows** (set `GITHUB_TOKEN` on the dev server for direct GitHub upload).

**CLI:**

```bash
npm run flow-preset:stage-free-pack
npm run flow-preset:publish-free-pack   # needs GITHUB_TOKEN
```

Remote path: `assets/libraries/flow-preset/` on `ternion-3d-assets-free` — see `extension/docs/ASSETS_ONLINE_REPO.md`.
