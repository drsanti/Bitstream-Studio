# TERNION Digital Twin

A VS Code extension that provides an integrated MQTT broker, 3D visualization, and bridge (Serial Port and Model Downloader) for building and testing digital twin applications.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Bridge (Serial Port and Model Downloader)](#bridge-serial-port-and-model-downloader)
- [Development](#development)
- [Documentation](#documentation)
- [Native Module Rebuild](#native-module-rebuild)
- [CA Certificate Installation](#ca-certificate-installation)

## Features

- **Integrated MQTT Broker**: Built-in Aedes broker for local MQTT testing.
- **3D Digital Twin Viewer**: High-performance 3D visualization using Three.js and Jolt Physics.
- **Serial Port Bridge**: Connect to hardware devices via a WebSocket bridge (serial port list, open, close, write, stream).
- **Model Downloader**: TESAIoT Product Model Store (list models, get info, download 3D models) via WebSocket bridge.
- **WebSocket Gateway**: Real-time data streaming between hardware, brokers, and the 3D UI.
- **Developer Tools**: Dedicated panels for monitoring MQTT clients, serial data, and physics state.

### Bridge (Serial Port and Model Downloader)

The extension runs a **bridge process** (broker + Serial Port and Model Downloader bridges) as an isolated Node process for stability. For development, run `npm run start:bridge` to start the WebSocket broker and both bridges. See [docs/BRIDGE.md](docs/BRIDGE.md) for architecture and run modes.

## Quick Start

1. **Open 3D World** — Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → "Open 3D World".
2. **Start Serial Bridge** (for Serial Port and Model Downloader in the Tester) — Command Palette → "Start Serial Bridge". Or from repo root: `cd t3d-extension && npm run start:bridge` to run broker + both bridges in two processes.
3. **Start MQTT Broker** (optional) — Command Palette → "Start MQTT Broker" (port 1883).

## Development

- **Command map (when to use which script)**: [docs/DEVELOPMENT_COMMANDS.md](docs/DEVELOPMENT_COMMANDS.md) — `npm start` vs `dev` vs `start:bridge`, Model Loader, AI bridge, ports **9998/9999**, and common mistakes.
- **Build**: `npm run compile` — compiles extension and webview.
- **Watch**: `npm run dev:all` — watch extension and webview with hot reload.
- **Bridge (dev)**: `npm run start:bridge` — run WebSocket broker and both bridges (Serial Port + Model Downloader) for testing in browser or webview.
- **AI gate (before PR)**: `npm run ai:gate` — runs AI debug smoke tests and full AI test suite.
- **Package**: `npm run package` — produce `.vsix` for install from VSIX.

Requires **VS Code 1.75+** and **Node.js 18+** (for building).

## Documentation

- **[Development tracker](docs/DEVELOPMENT_TRACKER.md)** — Done / planned / inbox for features and requirements (living doc).
- **[Assets location system](docs/ASSETS_LOCATION_SYSTEM.md)** — Disk layout, logical web paths, Vite dev URLs, and webview injection; **[Global asset directories](docs/GLOBAL_ASSET_DIRECTORIES.md)** is the compact checklist.
- **[Development commands](docs/DEVELOPMENT_COMMANDS.md)** — Which `npm` scripts to run for each workflow; ports and pitfalls.
- **[How the Bridge Works](docs/BRIDGE.md)** — Bridge architecture, run modes, and `npm run start:bridge`.
- **[Serial Port Bridge](src/serialport-bridge/ARCHITECTURE.md)** — Protocol and architecture.
- **[Serial Port Bridge Guide](src/serialport-bridge/GUIDE.md)** — How to run and use the Serial Port bridge.
- **[WebSocket Architecture](src/websocket/ARCHITECTURE.md)** — WebSocket broker and client.
- **[Bitstream protocol library](src/bitstream/README.md)** — Transport-agnostic host/firmware framing; [user manual](src/bitstream/docs/BITSTREAM_USER_MANUAL.md) includes extension webview shell notes (§14–§15).
- **[Bitstream webview app](src/webview/bitstream-app/README.md)** — React shell, stores, serial port list, Port Admin, host config mirror.
- **[TRN UI components](src/webview/ui/TRN/docs/README.md)** — Floating windows (`TRNWindow`, auto height), sections (`TRNSectionContainer`), layout primitives.
- **[Publishing](docs/PUBLISHING.md)** — How to publish the extension.
- **Troubleshooting** — [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (if present in this folder).

## Native Module Rebuild

This extension uses the `serialport` native module which requires rebuilding for VS Code's Electron version.

### Automatic Rebuild

The rebuild happens automatically on `npm install` via the `postinstall` script.

### Manual Rebuild

If you encounter a "No native build was found" error, rebuild for your VS Code's Electron version:

```bash
cd t3d-extension
npm run rebuild:serialport
```

### Different VS Code Versions

VS Code uses different Electron versions:

- **VS Code Stable** (1.107.x): Electron 37.7.0
- **VS Code Insiders** (1.109.x): Electron 39.2.7 or later

If the default rebuild doesn't work, specify the Electron version:

```bash
# For VS Code Insiders (Electron 39.2.7)
VSCODE_ELECTRON_VERSION=39.2.7 npm run rebuild:serialport

# For VS Code Stable (Electron 37.7.0)
VSCODE_ELECTRON_VERSION=37.7.0 npm run rebuild:serialport
```

**Finding your VS Code Electron version:**
Check the error message when activating the extension - it will show the required `electron=` version.

**Prerequisites for Windows:**

- Visual Studio Build Tools with C++ support
- Python 3 (for node-gyp)

## CA Certificate Installation

If you're using MQTT over TLS/WSS connections with custom or self-signed certificates, you'll need to install the CA certificate to your operating system's trust store. This allows browsers and applications (including VS Code webviews) to trust certificates signed by that CA.

### Manual Installation (Without CLI)

If you prefer to install the CA certificate manually without using the CLI scripts:

#### Windows

**Option 1: Certificate Manager (GUI)**

1. Press `Win + R`, type `certmgr.msc` and press Enter
2. Navigate to `Trusted Root Certification Authorities` → `Certificates`
3. Right-click → `All Tasks` → `Import`
4. Select your CA certificate file (`.pem` or `.crt`)
5. Click `Next` → `Finish`
6. Restart browsers/VS Code

**Option 2: PowerShell (as Administrator)**

```powershell
certutil -addstore -f Root "path\to\ca-chain.pem"
```

#### macOS

**Option 1: Keychain Access (GUI)**

1. Open "Keychain Access" app
2. Select "System" keychain (unlock if needed)
3. File → Import Items
4. Select your CA certificate file
5. Double-click the imported certificate
6. Expand "Trust" → Set to "Always Trust"
7. Close and enter your password
8. Restart browsers/VS Code

**Option 2: Command Line**

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /path/to/ca-chain.pem
```

#### Linux (Ubuntu/Debian)

```bash
# Copy certificate to system certificates directory
sudo cp ca-chain.pem /usr/local/share/ca-certificates/

# Update certificate store
sudo update-ca-certificates

# Restart browsers/VS Code
```

**For other Linux distributions**, the certificate location may vary. Common locations:

- Fedora/RHEL: `/etc/pki/ca-trust/source/anchors/`
- Arch Linux: `/etc/ca-certificates/trust-source/anchors/`

### Quick Installation (Using T3D CLI)

**Prerequisites:**

- Node.js 18+ installed
- T3D CLI installed (via `npm install -g @ternion/t3d` or `npm link`)
- Administrator/sudo privileges (required for certificate installation)
- Certificate file (`.pem` or `.crt` format)

**Install CA Certificate:**

```bash
t3d ca install --cert <path-to-certificate-file>
```

**Example:**

```bash
t3d ca install --cert src/mqtt-node/data/ca-chain.pem
```

**Uninstall CA Certificate (when no longer needed):**

```bash
t3d ca uninstall --cert <path-to-certificate-file>
```

**Note:** You can also pipe certificate content via stdin or use `--cert-content "<PEM>"` for inline PEM content. 

### Platform-Specific Notes

- **Windows**: Run PowerShell or Command Prompt as Administrator
  - Certificate is added to "Trusted Root Certification Authorities"
  - You may see a User Account Control (UAC) prompt
- **macOS**: You'll be prompted for your administrator password
  - Certificate is added to `/Library/Keychains/System.keychain`
  - You can verify in the "Keychain Access" app
- **Linux**: You'll be prompted for your sudo password
  - Works best on Debian/Ubuntu-based distributions
  - Certificate is copied to `/usr/local/share/ca-certificates/`

### After Installation

1. **Restart your web browsers** (Chrome, Firefox, Safari, Edge)
2. **Restart VS Code** if using MQTT connections
3. Applications will now trust certificates signed by the installed CA

### Why OS-Level Installation?

Browsers and VS Code webviews use the **operating system's certificate store** to validate SSL/TLS certificates. Installing the CA at the OS level ensures:

- All browsers automatically trust WSS connections
- VS Code webviews can connect to MQTT brokers over WSS
- No certificate errors when using custom/internal CA certificates

