# Asset storage — visual overview

Diagrams complement the canonical tables in **[Global asset directories](./GLOBAL_ASSET_DIRECTORIES.md)** and the operator notes in **[Managing downloaded assets](./MANAGING_DOWNLOADED_ASSETS.md)**. **Disk paths** and **webview base URIs** are related but not the same thing.

---

## Physical trees (where bytes live on disk)

Two primary buckets, plus an optional monorepo mirror. Both packs use the same shape: **`free/<category>/`** and **`tesaiot/<category>/`** (for example **`models`**, **`textures`**).

```mermaid
flowchart TB
  subgraph repoTree["Repo tree developer bundle"]
    RRoot["t3d-extension src assets"]
    RRoot --> RDev["Vite dev routes"]
    RDev --> RMap["src assets keys to __extension_src_assets"]
    RDev --> UDev["pack keys to __ternion_user mirrors"]
    RRoot --> RSub["free and tesaiot packs plus bundled models textures fonts"]
  end

  subgraph userTree["Per user tree VS Code only"]
    URoot["globalStorage extension id assets"]
    URoot --> UFree["free pack models textures"]
    URoot --> UTes["tesaiot pack models textures"]
  end

  subgraph monoTree["Optional monorepo mirror"]
    MRoot["ternion-t3d assets"]
    MRoot --> MFree["free"]
    MRoot --> MTes["tesaiot"]
    MNote["same pack layout as globalStorage"]
  end
```

---

## Free Loader — where sync writes

```mermaid
flowchart LR
  FL["Free Loader user runs sync"]

  FL --> Mode{"Host mode"}

  Mode -->|"VS Code webview"| A["postMessage to extension"]
  A --> G["globalStorage assets free"]
  G --> Gsub["models textures under free"]

  Mode -->|"Browser plus bridge"| B["WebSocket to Node bridge"]
  B --> P{"Bridge picks output root"}

  P -->|"Monorepo rule"| M["ternion-t3d assets free"]
  P -->|"Env override"| E["TERNION BRIDGE FREE ASSETS OUTPUT DIR"]
```

GitHub source layout for the pack: [`ternion-3d-assets-free` / `assets`](https://github.com/drsanti/ternion-3d-assets-free/tree/main/assets). The sync strips the leading `assets/` segment and writes the remainder under the chosen **output root** (see `syncTernionFreeAssets` in `src/asset-sync/syncTernionFreeAssets.ts`).

---

## Model Loader — where catalog downloads write

```mermaid
flowchart LR
  ML["Model Loader user downloads"]

  ML --> Mmode{"Host mode"}

  Mmode -->|"VS Code webview"| X["extension resolves default"]
  X --> T["globalStorage assets tesaiot models"]

  Mmode -->|"Browser plus bridge"| Y["bridge default or injected"]
  Y --> D["monorepo assets tesaiot models"]
  Y --> Z["or host injected globalStorage root"]
```

---

## Runtime in the webview (URLs, not disk paths)

The panel resolves relative keys using **injected bases** (`LOCAL`, `FREE`, `TESAIOT_TEXTURES`, `ONLINE`, …). That layer is **orthogonal** to the folders above: the host maps `globalStorage` and bundled `out/webview/assets` to **fetchable URIs**. In **Vite dev on `localhost:5173`**, pack paths may resolve via **`/__ternion_user_*`** instead of only **`/__extension_src_assets`** — see [Assets location system](./ASSETS_LOCATION_SYSTEM.md).

```mermaid
flowchart TB
  subgraph windowGlobals["Window globals set by host or main"]
    L["LOCAL ASSETS BASE URI"]
    F["FREE ASSETS BASE URI"]
    O["ONLINE ASSETS BASE URI"]
  end

  Rel["Relative path example textures cubemap face"]

  Rel --> Resolver["resolveWebviewModelAssetUrl"]
  Resolver --> L
  Resolver --> F
  Resolver --> O

  Resolver --> Fetch["Browser fetch URL"]
```

Use **Asset Manager → Global directories → Runtime** in the product UI to inspect current base URIs and refresh from the host when wired.

---

## Quick reference table

| Surface | Free pack | Tesaiot pack |
| ------- | ---------- | ------------- |
| VS Code webview | `<globalStorage>/assets/free/` (`free/models/`, `free/textures/`, …) | `<globalStorage>/assets/tesaiot/` (`tesaiot/models/`, `tesaiot/textures/`, …) |
| Browser + bridge (typical) | Monorepo **`ternion-t3d/assets/free/`** or **`TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR`** | Monorepo **`ternion-t3d/assets/tesaiot/`** or **`TERNION_BRIDGE_MODEL_DOWNLOADS_OUTPUT_DIR`** (models under **`tesaiot/models/`**) |

For segment constants, use **[Global asset directories](./GLOBAL_ASSET_DIRECTORIES.md)** as the checklist.
