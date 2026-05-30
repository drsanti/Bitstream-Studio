# Publishing to VS Code Marketplace

Complete guide for publishing the TERNION Digital Twin extension to the VS Code Marketplace.

## Quick Reference

**Published Extension:** https://marketplace.visualstudio.com/items?itemName=TERNIONDEV.ternion-digital-twin

**One Command Publishing:**

```bash
npm run release:patch    # Bug fixes
npm run release:minor    # New features
npm run release:major    # Breaking changes
```

## Prerequisites

Before publishing, ensure you have:

1. **Publisher Account** registered on VS Code Marketplace
2. **Personal Access Token (PAT)** with `Marketplace (Manage)` scope

### Setup Authentication

1. Visit: https://marketplace.visualstudio.com/manage/publishers/
2. Create a Personal Access Token with `Marketplace (Manage)` scope
3. Login to marketplace:

```bash
vsce login terniondev
```

## Publishing Workflow

### Step 1: Choose Release Type

Decide what type of release:

- **Patch** (`release:patch`): Bug fixes, small improvements
- **Minor** (`release:minor`): New features, backward compatible
- **Major** (`release:major`): Breaking changes

### Step 2: Publish

```bash
npm run release:patch
```

**This single command does everything:**

1. ✅ Increments version in `package.json`
2. ✅ Creates git commit and tag
3. ✅ Compiles TypeScript and webview
4. ✅ Packages into `.vsix` file
5. ✅ Publishes to marketplace

### Step 3: Verify

1. Wait 5-10 minutes for processing
2. Check: https://marketplace.visualstudio.com/items?itemName=TERNIONDEV.ternion-digital-twin
3. Verify version in "Version History" tab

## Alternative Workflows

### Manual Version Control

```bash
npm run version:patch    # Update version first
npm run publish          # Then publish
```

### Test Before Publishing

```bash
npm run package
code --install-extension ternion-digital-twin-*.vsix
```

## Pre-Publishing Checklist

- [ ] Code compiles without errors
- [ ] Extension tested locally
- [ ] Version incremented
- [ ] README.md updated
- [ ] Git repository clean

## What Gets Published

**Included in VSIX:**

- `LICENSE.txt`, `README.md`, `package.json`
- `out/extension.js` (Compiled Main Extension)
- `out/combined-bridge-entry.js` (Compiled Serial Bridge Orchestrator)
- `out/webview/*` (Built React Webview)

**Excluded:**

- Source TypeScript files
- Documentation files
- Build configuration files

See `.vscodeignore` for complete list. For example, copied bundles under `out/webview/assets/models/**`, `out/webview/assets/tesaiot/**`, and `out/webview/assets/free/textures/**` are ignored so large scene files and reference textures are not shipped to the Marketplace by default.

## Troubleshooting

**"Personal Access Token verification failed"**

- Generate new PAT with correct permissions
- Run `vsce login terniondev` again

**"Version already exists"**

- Increment version in `package.json` or run `npm run version:patch`

**Extension doesn't appear in marketplace**

- Wait up to 24 hours for indexing
- Check publisher dashboard

**Build errors**

```bash
rm -rf out/
npm run compile
```

## Version Management

**Semantic Versioning:** `MAJOR.MINOR.PATCH`

- **Patch** (0.0.3): Bug fixes
- **Minor** (0.1.0): New features
- **Major** (1.0.0): Breaking changes

**Manual version control:**

```bash
npm version patch    # or minor, major
```

## Platform Constraints

- **vscode.dev SharedArrayBuffer Limitation**: Browser-hosted VS Code (`vscode.dev`) does not currently enable cross-origin isolation, so extensions cannot access `SharedArrayBuffer`. Multi-threaded WebAssembly (for example, emscripten builds that rely on workers) will fail to start unless the browser runs with reduced security flags. Track upstream status in issue #137884 before depending on `SharedArrayBuffer` features in the web client.


```
https://dev.azure.com/drsanti/_usersSettings/tokens

FPPc3RXMqtMSQJEAj1o7UC2DKSeRBBi5tvfo4rfmnwMyQuVni4bgJQQJ99BLACAAAAAIPUJ7AAAGAZDO2LGj

https://marketplace.visualstudio.com/

```
