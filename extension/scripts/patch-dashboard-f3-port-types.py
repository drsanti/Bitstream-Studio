from pathlib import Path

ROOT = Path("src/webview/sensor-studio")

replacements = [
    (
        'export type StudioPortType =\n  | "number"',
        'export type StudioPortType =\n  | "number"',
    ),
]

# flow-graph-types.ts
p = ROOT / "features/editor/flow-graph-types.ts"
text = p.read_text(encoding="utf-8")
if '"dashboardTheme"' not in text:
    text = text.replace(
        '  | "dashboardWidget";',
        '  | "dashboardWidget"\n  | "dashboardTheme";',
    )
    p.write_text(text, encoding="utf-8")

# config-types.ts
p = ROOT / "core/config/config-types.ts"
text = p.read_text(encoding="utf-8")
if "dashboardTheme" not in text:
    text = text.replace(
        "  dashboardWidget: string;",
        "  dashboardWidget: string;\n  dashboardTheme: string;",
    )
    text = text.replace(
        '| "dashboardWidget"',
        '| "dashboardWidget"\n    | "dashboardTheme"',
    )
    p.write_text(text, encoding="utf-8")

# data-type-colors.config.ts
p = ROOT / "config/data-type-colors.config.ts"
text = p.read_text(encoding="utf-8")
if "dashboardTheme" not in text:
    text = text.replace(
        'dashboardWidget: "#E879F9",',
        'dashboardWidget: "#E879F9",\n    dashboardTheme: "#C084FC",',
    )
    p.write_text(text, encoding="utf-8")

# schemas
for rel in [
    "core/schema/config/data-type-colors.schema.ts",
    "core/schema/config/node-catalog.schema.ts",
]:
    p = ROOT / rel
    text = p.read_text(encoding="utf-8")
    if "dashboardTheme" not in text:
        text = text.replace('"dashboardWidget",', '"dashboardWidget",\n  "dashboardTheme",')
        if "data-type-colors" in rel:
            text = text.replace(
                'dashboardWidget: z.string().min(1).default("#E879F9"),',
                'dashboardWidget: z.string().min(1).default("#E879F9"),\n    dashboardTheme: z.string().min(1).default("#C084FC"),',
            )
        p.write_text(text, encoding="utf-8")

# port-accent.ts
p = ROOT / "features/editor/nodes/port-accent.ts"
text = p.read_text(encoding="utf-8")
if "dashboardTheme" not in text:
    text = text.replace(
        '    case "dashboardWidget":\n      return DT.dashboardWidget;',
        '    case "dashboardWidget":\n      return DT.dashboardWidget;\n    case "dashboardTheme":\n      return DT.dashboardTheme;',
    )
    p.write_text(text, encoding="utf-8")

# studio-port-type-menu-icon.tsx
p = ROOT / "features/editor/nodes/studio-port-type-menu-icon.tsx"
text = p.read_text(encoding="utf-8")
if "dashboardTheme" not in text:
    text = text.replace(
        "  LayoutGrid,\n  Lightbulb,",
        "  LayoutGrid,\n  Palette,\n  Lightbulb,",
    )
    text = text.replace(
        "  dashboardWidget: LayoutGrid,\n};",
        "  dashboardWidget: LayoutGrid,\n  dashboardTheme: Palette,\n};",
    )
    p.write_text(text, encoding="utf-8")

print("patched dashboardTheme port type")
