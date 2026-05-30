# Troubleshooting & Resolution Report: Serial Bridge & TypeScript Fixes

This document summarizes the technical issues encountered during development and the solutions implemented to resolve them.

## 1. TypeScript Compilation Errors

### Issue: Incorrect `child_process` Import
- **Problem**: In `src/bridge-handle.ts`, the code used `import { child_process } from 'node:child_process';`.
- **Cause**: The `node:child_process` module does not have a named export called `child_process`. However, the code attempted to use it as a namespace (e.g., `child_process.spawn`).
- **Solution**: Changed the import to a namespace import: `import * as child_process from 'node:child_process';`.

### Issue: Broken Type Metadata Imports
- **Problem**: `BrokerStatus` and `ClientInfo` imports were failing in `src/broker-control/control-client.ts` and `control-server.ts`.
- **Cause**: The import paths pointed to a non-existent directory: `../webview/components/broker-panel/types`.
- **Solution**: Updated the paths to the correct location: `../mqtt/aedes/types.ts`.

---

## 2. Serial Bridge Connection Failures (`ws://localhost:9998/`)

### Issue: Missing `tsx` Dependency
- **Problem**: The bridge was started via `npx tsx`, but `tsx` was not in `package.json`.
- **Cause**: In background processes, `npx` might hang or fail while trying to download missing packages without a terminal prompt.
- **Solution**: Installed `tsx` as a `devDependency` to ensure it is always available locally.

### Issue: Unreliable Process Spawning on Windows
- **Problem**: The Serial Bridge process failed to start, resulting in `WebSocket connection failed`.
- **Cause**: Spawning `npm` directly via Node.js `child_process.spawn` is unreliable on Windows. Windows requires `npm.cmd`.
- **Solution**: Implemented logic to detect the OS and use the appropriate command:
  ```typescript
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  ```

### Issue: Working Directory (CWD) Ambiguity
- **Problem**: The spawned process occasionally failed to find the project's `package.json`.
- **Cause**: If no workspace folder was active, `process.cwd()` might return a system path or the VS Code installation path.
- **Solution**: Updated the bridge handler to accept and use the `extensionPath` provided by VS Code's `ExtensionContext` as a fallback CWD.

---

## 3. Marketplace Readiness & Production Architecture

To ensure the extension works for end-users without requiring them to install Node.js, npm, or dev-dependencies manually, the following production-grade architecture was implemented:

### Isolated Process Architecture
The extension now utilizes a dual-layer approach for stability and hardware compatibility:
1.  **Main Extension Process (MQTT & UI)**: 
    - The MQTT Broker (Aedes) runs directly within the VS Code Extension Host.
    - Since it is pure JavaScript, it shares the extension's memory and lifecycle.
2.  **Isolated Bridge Process (Serial Port & WebSockets)**:
    - The Serial Bridge (which uses native C++ modules) is spawned as a **separate Node.js process**.
    - **Why?**: Isolated processes prevent hardware-level crashes from taking down the entire extension. It also bypasses Electron version mismatches common with native modules like `serialport`.

### Production Distribution Strategy
- **Bundled Entry Point**: Created `src/combined-bridge-entry.ts`, which bundles both the WebSocket server and Serial Bridge into a single JavaScript file (`out/combined-bridge-entry.js`).
- **Native Runtime Spawning**: The extension now spawns the bridge using `process.execPath` (the Node.js runtime bundled with VS Code) instead of `npm`.
    - **User Benefit**: Users do not need Node.js or `npm` installed on their machine to use the Serial Bridge.
- **Self-Contained Logic**: By bundling all dependencies into the `out/` folder, the extension is fully self-contained and ready for `vsce package`.

---

## 4. Improved Observability

### Solution: Dedicated Output Channel
- **Implementation**: Created the **"TERNION Serial Bridge"** Output Channel.
- **Benefit**: Developers can now see the exact command being run, the CWD being used, and any standard output/error messages from the background Node.js process.
- **Logging Added**:
    - OS detection logs (`win32` vs `linux/darwin`).
    - Full spawn command string.
    - Active CWD path.
    - Critical spawn error notifications.

---

## Summary of Changes
- **Files Modified**: 
    - `src/bridge-handle.ts` (Robust spawning, imports, logging)
    - `src/extension.ts` (Context passing)
    - `src/broker-control/control-client.ts` (Imports)
    - `src/broker-control/control-server.ts` (Imports)
    - `package.json` (Added `tsx`)
- **Status**: Tested and verified. Serial Bridge now initializes automatically on extension activation and allows for successful WebSocket connections from the webview.
