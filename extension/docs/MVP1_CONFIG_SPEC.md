# MVP1 Config Specification

This document defines the configuration contract for MVP1 Node Editor.
It is the implementation-ready reference for config keys, schema boundaries, persistence, and migration.

## Goals

- Enforce a configuration-first architecture.
- Eliminate hardcoded UI/runtime constants from feature components.
- Support future Settings UI integration without source-code edits.
- Ensure backward compatibility with versioned config migration.

## Non-Goals (MVP1)

- Cloud sync for config.
- Team/shared multi-user configuration.
- Remote config rollout.

---

## Config Domains

MVP1 uses these config domains:

1. `theme`
2. `dataTypeColors`
3. `nodeCatalog`
4. `runtimeDefaults`
5. `featureFlags`

Each domain has:

- `configVersion`
- `updatedAt`
- `payload`

---

## File Layout (Source of Defaults)

```text
src/webview/sensor-studio/config/
├─ theme.config.ts
├─ data-type-colors.config.ts
├─ node-catalog.config.ts
├─ runtime-defaults.config.ts
└─ feature-flags.config.ts
```

Schema files:

```text
src/webview/sensor-studio/core/schema/config/
├─ theme.config.schema.ts
├─ data-type-colors.schema.ts
├─ node-catalog.schema.ts
├─ runtime-defaults.schema.ts
└─ feature-flags.schema.ts
```

Persistence files:

```text
src/webview/sensor-studio/persistence/
├─ config.repository.ts
└─ config.migrations.ts
```

Service layer:

```text
src/webview/sensor-studio/core/config/
├─ config-service.ts
├─ config-types.ts
└─ config-safe-mode.ts
```

---

## Schema Contract (Type-Level)

## Top-Level Wrapper

Every domain payload is wrapped by:

```ts
type VersionedConfig<TPayload> = {
  configVersion: number;
  updatedAt: string; // ISO datetime
  payload: TPayload;
};
```

---

## Domain: theme

Purpose: global semantic UI tokens.

Required payload keys:

- `color.background.canvas`
- `color.background.panel`
- `color.border.default`
- `color.text.primary`
- `color.text.secondary`
- `color.status.ok`
- `color.status.warning`
- `color.status.error`
- `color.status.info`

Example:

```json
{
  "configVersion": 1,
  "updatedAt": "2026-05-04T14:00:00.000Z",
  "payload": {
    "color": {
      "background": {
        "canvas": "#0A0A0C",
        "panel": "#111319"
      },
      "border": {
        "default": "#31343D"
      },
      "text": {
        "primary": "#E7E9EE",
        "secondary": "#9AA1B2"
      },
      "status": {
        "ok": "#22C55E",
        "warning": "#F59E0B",
        "error": "#EF4444",
        "info": "#38BDF8"
      }
    }
  }
}
```

---

## Domain: dataTypeColors

Purpose: semantic mapping for graph/data tokens.

Required payload keys:

- `number`
- `boolean`
- `string`
- `event`
- `vector3`
- `quaternion`

Example:

```json
{
  "configVersion": 1,
  "updatedAt": "2026-05-04T14:00:00.000Z",
  "payload": {
    "number": "#60A5FA",
    "boolean": "#A78BFA",
    "string": "#34D399",
    "event": "#F59E0B",
    "vector3": "#F472B6",
    "quaternion": "#22D3EE"
  }
}
```

---

## Domain: nodeCatalog

Purpose: display metadata and defaults for node presentation.

Each node entry should define:

- `id`
- `category` (`input`, `transform`, `logic`, `output`, `utility`)
- `title`
- `description`
- `icon`
- `defaultVisible`
- `defaultConfig` (domain-specific settings)

Example:

```json
{
  "configVersion": 1,
  "updatedAt": "2026-05-04T14:00:00.000Z",
  "payload": {
    "nodes": [
      {
        "id": "threshold",
        "category": "transform",
        "title": "Threshold",
        "description": "Compare input against threshold value.",
        "icon": "gauge",
        "defaultVisible": true,
        "defaultConfig": {
          "operator": ">",
          "value": 0.5
        }
      }
    ]
  }
}
```

---

## Domain: runtimeDefaults

Purpose: default runtime tuning values.

Required payload keys:

- `tickRateHz`
- `maxBufferedSamples`
- `defaultSmoothingAlpha`
- `defaultThresholdValue`
- `maxHistoryPoints`

Example:

```json
{
  "configVersion": 1,
  "updatedAt": "2026-05-04T14:00:00.000Z",
  "payload": {
    "tickRateHz": 30,
    "maxBufferedSamples": 512,
    "defaultSmoothingAlpha": 0.2,
    "defaultThresholdValue": 0.5,
    "maxHistoryPoints": 240
  }
}
```

---

## Domain: featureFlags

Purpose: controlled rollout for optional behavior.

Recommended keys:

- `enableSparklineNode`
- `enableDebugValueNode`
- `enableInspectorAdvancedPanel`
- `enableRuntimeTraceOverlay`

Example:

```json
{
  "configVersion": 1,
  "updatedAt": "2026-05-04T14:00:00.000Z",
  "payload": {
    "enableSparklineNode": true,
    "enableDebugValueNode": true,
    "enableInspectorAdvancedPanel": false,
    "enableRuntimeTraceOverlay": false
  }
}
```

---

## Config Access Layer Contract

All feature code must access configuration through service APIs only.

Required API surface:

```ts
type ConfigService = {
  getTheme(): ThemeConfig;
  getDataTypeColors(): DataTypeColorsConfig;
  getNodeCatalog(): NodeCatalogConfig;
  getRuntimeDefaults(): RuntimeDefaultsConfig;
  getFeatureFlags(): FeatureFlagsConfig;
  updateDomain<TDomain>(domain: string, updater: (prev: TDomain) => TDomain): void;
  subscribe(domain: string, listener: () => void): () => void;
  resetToDefaults(domain?: string): void;
};
```

Rules:

- UI components must not import raw config files directly.
- Runtime logic must use resolved config snapshot from `configService`.
- Settings UI (future) updates config through `updateDomain`.

---

## Persistence Strategy

Storage key recommendation:

- `sensor-studio:config:theme`
- `sensor-studio:config:data-type-colors`
- `sensor-studio:config:node-catalog`
- `sensor-studio:config:runtime-defaults`
- `sensor-studio:config:feature-flags`

Load order:

1. Built-in defaults from source files
2. Persisted user override from storage
3. Validate with Zod
4. If invalid, run migration; if still invalid, fallback to defaults and log warning

---

## Migration Strategy

Migration requirements:

- Migrations are explicit and deterministic.
- Each migration handles one version step (`vN -> vN+1`).
- Migration runs before schema parse of target version.

Example migration table:

```ts
const themeMigrations = {
  1: (v1: any) => ({
    ...v1,
    configVersion: 2,
    payload: {
      ...v1.payload,
      color: {
        ...v1.payload.color,
        border: {
          default: v1.payload.color.border?.default ?? "#31343D",
        },
      },
    },
  }),
};
```

Migration flow:

1. Detect `configVersion`
2. Apply chained migrations until `CURRENT_VERSION`
3. Validate migrated payload
4. Persist migrated payload back to storage

---

## Safe Mode Behavior

If parse/migration fails:

- App must not crash.
- Domain falls back to built-in defaults.
- Emit warning to runtime console once per domain.
- Set a `safeMode` flag for diagnostics UI.

Suggested warning format:

```text
[ConfigSafeMode] domain=runtimeDefaults reason=invalid-schema fallback=defaults
```

---

## Implementation Checklist (Config-Specific)

- [ ] Add schema files for all 5 domains
- [ ] Add source default config files for all 5 domains
- [ ] Implement `configService` with `get/set/subscribe/reset`
- [ ] Add persistence repository per domain key
- [ ] Add migration runner and version map
- [ ] Add safe mode fallback and warning logger
- [ ] Replace direct constants usage with semantic config tokens
- [ ] Add unit tests for parse, migrate, fallback

---

## Acceptance Criteria

MVP1 config architecture is accepted when:

- [ ] No feature component relies on hardcoded visual/runtime constants that are defined in config domains
- [ ] All config domains parse via Zod at startup
- [ ] Invalid persisted config cannot crash app
- [ ] Config migration path is tested for at least one version bump
- [ ] Runtime can read updated config values from centralized service

