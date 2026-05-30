# Digital Twin simulations (webview)

Isolated, self-contained 3D simulation apps ported from `ternion-t3d` without `@ternion/t3d`.

## Rules

- **No imports** between `e84-rotation/`, `abb-robot/`, and `vehicle-physics/`.
- **No imports** from `sensor-studio/` or `bitstream-app/` state (BS2, telemetry, workspace).
- Use **`shared/`** only for generic shell, canvas, and thin asset/MQTT helpers.
- Use **`catalog/`** for metadata and `import()` loaders only.
- Each app exports one root component from **`index.ts`**.

Full migration plan: [`../../../docs/APPLICATION_MIGRATION_PLAN.md`](../../../docs/APPLICATION_MIGRATION_PLAN.md).
