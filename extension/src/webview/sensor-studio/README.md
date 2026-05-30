# Sensor Studio (MVP1) - Developer README

This folder contains the new Sensor Studio foundation for MVP1.
Current focus is configuration-first architecture and Node Editor groundwork.

## Start Here (Recommended Reading Order)

1. Docs index:
   - [`../../../docs/README.md`](../../../docs/README.md)
2. MVP1 task board:
   - [`../../../docs/MVP1_NODE_EDITOR_TASK_BOARD.md`](../../../docs/MVP1_NODE_EDITOR_TASK_BOARD.md)
3. Day-by-day execution:
   - [`../../../docs/MVP1_NODE_EDITOR_EXECUTION_CHECKLIST.md`](../../../docs/MVP1_NODE_EDITOR_EXECUTION_CHECKLIST.md)
4. Config contract (implementation reference):
   - [`../../../docs/MVP1_CONFIG_SPEC.md`](../../../docs/MVP1_CONFIG_SPEC.md)
5. Device sensor settings vs Node Inspector (implementation plan):
   - [`docs/DEVICE_SENSOR_SETTINGS_IMPLEMENTATION_PLAN.md`](./docs/DEVICE_SENSOR_SETTINGS_IMPLEMENTATION_PLAN.md)
6. Rotation preview scene JSON (`Scene3DConfigV1`) — authoring, coercion, shadows:
   - [`docs/ROTATION_SCENE3D_CONFIG.md`](./docs/ROTATION_SCENE3D_CONFIG.md)

## Current Structure

```text
sensor-studio/
├─ README.md
├─ docs/
│  ├─ DEVICE_SENSOR_SETTINGS_IMPLEMENTATION_PLAN.md
│  └─ ROTATION_SCENE3D_CONFIG.md
├─ index.ts
├─ app/
├─ config/
├─ core/
│  ├─ config/
│  └─ schema/config/
├─ features/
│  └─ editor/
│     ├─ components/rotation/Rotation3DInspectorCards.tsx
│     └─ nodes/rotation/
│        ├─ scene3d-config.ts
│        ├─ RotationPreviewPanelV4.tsx
│        └─ rotation-preview-shadow-runtime.ts
└─ persistence/
```

## Important Files to Open First

### Public Entry

- [`index.ts`](./index.ts)
- [`app/SensorStudioApp.tsx`](./app/SensorStudioApp.tsx)
- [`app/SensorStudioMain.tsx`](./app/SensorStudioMain.tsx)
- [`app/providers/SensorStudioProviders.tsx`](./app/providers/SensorStudioProviders.tsx)

### Config Defaults (Source of truth for defaults)

- [`config/theme.config.ts`](./config/theme.config.ts)
- [`config/data-type-colors.config.ts`](./config/data-type-colors.config.ts)
- [`config/node-catalog.config.ts`](./config/node-catalog.config.ts)
- [`config/runtime-defaults.config.ts`](./config/runtime-defaults.config.ts)
- [`config/feature-flags.config.ts`](./config/feature-flags.config.ts)

### Config Types and Service

- [`core/config/config-types.ts`](./core/config/config-types.ts)
- [`core/config/config-service.ts`](./core/config/config-service.ts)
- [`core/config/config-safe-mode.ts`](./core/config/config-safe-mode.ts)

### Schema Validation

- [`core/schema/config/theme.config.schema.ts`](./core/schema/config/theme.config.schema.ts)
- [`core/schema/config/data-type-colors.schema.ts`](./core/schema/config/data-type-colors.schema.ts)
- [`core/schema/config/node-catalog.schema.ts`](./core/schema/config/node-catalog.schema.ts)
- [`core/schema/config/runtime-defaults.schema.ts`](./core/schema/config/runtime-defaults.schema.ts)
- [`core/schema/config/feature-flags.schema.ts`](./core/schema/config/feature-flags.schema.ts)

### Persistence and Migration

- [`persistence/config.repository.ts`](./persistence/config.repository.ts)
- [`persistence/config.migrations.ts`](./persistence/config.migrations.ts)

### Rotation 3D preview (scene rig)

- Default PCB GLB URLs use **`resolveDefaultPreviewMeshGlbUrl()`** (shared with Bitstream) so packaged VSIX installs resolve assets from the free mirror / online roots — not `import.meta.url` under omitted `out/webview/assets/models`. See [`docs/ROTATION_SCENE3D_CONFIG.md`](./docs/ROTATION_SCENE3D_CONFIG.md) and [`docs/ASSETS_LOCATION_SYSTEM.md`](../../../docs/ASSETS_LOCATION_SYSTEM.md).
- [`features/editor/nodes/rotation/scene3d-config.ts`](./features/editor/nodes/rotation/scene3d-config.ts) — `Scene3DConfigV1`, defaults, `coerceScene3DConfigV1`, `persistScene3DConfig`
- [`features/editor/nodes/rotation/RotationPreviewPanelV4.tsx`](./features/editor/nodes/rotation/RotationPreviewPanelV4.tsx) — Three.js preview runtime
- [`features/editor/nodes/rotation/rotation-preview-shadow-runtime.ts`](./features/editor/nodes/rotation/rotation-preview-shadow-runtime.ts) — shadow helpers shared with the panel
- [`features/editor/components/rotation/Rotation3DInspectorCards.tsx`](./features/editor/components/rotation/Rotation3DInspectorCards.tsx) — inspector UI
- Design note: [`docs/ROTATION_SCENE3D_CONFIG.md`](./docs/ROTATION_SCENE3D_CONFIG.md)

## Development Rules (Applied in This Folder)

- Configuration-first: do not hardcode UI/runtime constants in feature components.
- Use `configService` for all reads/updates/subscriptions.
- Validate persisted config with Zod before use.
- Use migration flow for config version upgrades.
- If config parsing fails, fallback to defaults and warn once (safe mode).

## Next Implementation Steps

1. Add app shell and provider wiring for Node Editor page.
2. Add config service unit tests (parse/migrate/fallback/reset).
3. Add graph/editor/runtime skeleton under `features/` and `core/graph`.
4. Integrate `configService` into first UI shell (Palette/Canvas/Inspector placeholders).

## Quick Verification Commands

From project root:

- `npm run compile`
- `npx tsx --test tests/sensor-studio/*.test.ts`

## How to Open Sensor Studio Shell

- Browser/webview query param (loads **inside** the Bitstream shell so serial/WebSocket session and live telemetry work):
  - `?app=sensor-studio`

Example:

- `http://localhost:5173/?app=sensor-studio`

Hardware live path:

- Connect the device from the **Bitstream** toolbar (same as the main sensor workspace).
- Each **Sensor Input** node reads `defaultConfig.sourceKey` (see catalog default `bmi270.accel.x`) and maps it through `core/live/resolve-sensor-source-key.ts` from `useBitstreamLiveStore().latestByHint`.
- If no sample is available for that source yet, the editor uses **synthesized placeholder** values for that tick until Bitstream data arrives.
- Sensor hardware nodes may show **live**, **stale**, or **offline** header badges after each graph tick when freshness matters.
- `sourceKey` is allowlisted: `STUDIO_SENSOR_SOURCE_KEY_OPTIONS` in `core/live/resolve-sensor-source-key.ts` is validated by the **node catalog** Zod schema, the flow editor **JSON** editor, and the Inspector **Custom sourceKey** text field (inline error on blur). `updateSelectedNodeConfigField` returns `false` when a value is rejected.

Toolbar quick actions:

- `Add Sensor`
- `Add Threshold`
- `Run Demo Template`
- `Clear`
- Template preset selector (`Basic Indicator`, `Gauge Monitor`, `Signal Chain`)

Hotkeys:

- `Ctrl+1` run selected template
- `Ctrl+Shift+1` run `basic-indicator` directly
- `Ctrl+Shift+2` run `gauge-monitor` directly
- `Ctrl+Shift+3` run `signal-chain` directly
- `Ctrl+2` select `gauge-monitor` template
- `Ctrl+3` select `signal-chain` template
- `Ctrl+4` select `basic-indicator` template
- `Ctrl+Backspace` clear canvas
- `Esc` close shortcuts panel

Toolbar helper:

- `Shortcuts` button opens a quick keyboard help panel
- Flow canvas shows `Edge type` color legend
- Flow canvas shows a compact shortcuts cheat-sheet at the bottom-right (always visible; does not block pointer events)

