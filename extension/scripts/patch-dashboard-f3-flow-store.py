from pathlib import Path

p = Path("src/webview/sensor-studio/features/editor/store/flow-editor.store.ts")
text = p.read_text(encoding="utf-8")


def repl(old: str, new: str, label: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f"{label}: marker missing")
    text = text.replace(old, new, 1)


repl(
    'import { evaluateDashboardSnapshot } from "../../../core/dashboard/evaluate-dashboard-snapshot";',
    'import { evaluateDashboardSnapshot } from "../../../core/dashboard/evaluate-dashboard-snapshot";\n'
    'import { coerceFlowWireDashboardThemeV1, flowValueAsDashboardTheme } from "../nodes/dashboard/flow-wire-dashboard-theme";',
    "theme wire import",
)

repl(
    'import { STUDIO_HANDLE_OUT, STUDIO_HANDLE_IN',
    'import { STUDIO_HANDLE_OUT, STUDIO_HANDLE_IN, STUDIO_HANDLE_THEME',
    "STUDIO_HANDLE_THEME import",
)

repl(
    "  liveEnvironmentWire?: FlowWireEnvironmentV1;",
    "  liveEnvironmentWire?: FlowWireEnvironmentV1;\n  liveDashboardThemeWire?: import(\"../nodes/dashboard/flow-wire-dashboard-theme\").FlowWireDashboardThemeV1;",
    "liveDashboardThemeWire type",
)

repl(
    """        if (
          node.data.nodeId === "knob" ||
          node.data.nodeId === "dashboard-knob"
        ) {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const raw = dc.value;
          const v =
            typeof raw === "number" && Number.isFinite(raw)
              ? raw
              : coerceNumberConstantValue(dc, raw);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), v);
          continue;
        }""",
    """        if (node.data.nodeId === "dashboard-theme") {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            coerceFlowWireDashboardThemeV1(dc.theme ?? dc),
          );
          continue;
        }

        if (
          node.data.nodeId === "knob" ||
          node.data.nodeId === "dashboard-knob"
        ) {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const raw = dc.value;
          const v =
            typeof raw === "number" && Number.isFinite(raw)
              ? raw
              : coerceNumberConstantValue(dc, raw);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), v);
          continue;
        }""",
    "dashboard-theme pin",
)

repl(
    """        if (node.data.nodeId === "dashboard-knob") {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const raw = dc.value;
          base.liveValue =
            typeof raw === "number" && Number.isFinite(raw) ? raw : null;
          base.liveHistory = [];
        }""",
    """        if (node.data.nodeId === "dashboard-knob") {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const raw = dc.value;
          base.liveValue =
            typeof raw === "number" && Number.isFinite(raw) ? raw : null;
          base.liveHistory = [];
        }

        if (node.data.nodeId === "dashboard-output") {
          const themeVal = readIncoming(node.id, STUDIO_HANDLE_THEME);
          const themeWire = flowValueAsDashboardTheme(themeVal);
          if (themeWire != null) {
            base.liveDashboardThemeWire = themeWire;
          } else {
            delete base.liveDashboardThemeWire;
          }
        }""",
    "dashboard-output theme live",
)

p.write_text(text, encoding="utf-8")
print("patched flow-editor for F3 theme")
