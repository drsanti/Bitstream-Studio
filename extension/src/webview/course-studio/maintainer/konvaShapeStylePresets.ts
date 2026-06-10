export const KONVA_STROKE_PRESETS = ["#f5f5f5", "#ef4444", "#22c55e", "#3b82f6", "#f59e0b"] as const;
export const KONVA_FILL_PRESETS = ["transparent", "#1e293b", "#14532d", "#450a0a", "#422006"] as const;
export const KONVA_TEXT_PRESETS = ["#f5f5f5", "#ef4444", "#22d3ee", "#fbbf24", "#a78bfa"] as const;
export const KONVA_STROKE_WIDTH_PRESETS = [1, 2, 4, 8] as const;

const KONVA_SHAPE_TYPE_LABELS: Record<string, string> = {
  rect: "Rectangle",
  diamond: "Diamond",
  circle: "Circle",
  text: "Text label",
  line: "Line",
  arrow: "Arrow",
  group: "Group",
};

export function konvaShapeTypeLabel(type: string | undefined): string {
  if (type == null) {
    return "Shape";
  }
  return KONVA_SHAPE_TYPE_LABELS[type] ?? type;
}

export function konvaColorsMatch(a: string | undefined, b: string): boolean {
  return (a ?? "").toLowerCase() === b.toLowerCase();
}
