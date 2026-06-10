import type { DiagramKonvaFreeformV1 } from "../../schemas/diagramFreeform";
import type { KonvaPropertyBindingValueV1 } from "../../schemas/konvaPropertyBindings";
import {
  isKonvaGateBinding,
  isKonvaNumericPropertyBinding,
  isKonvaTextPropertyBinding,
} from "../../schemas/konvaPropertyBindings";
import type { KonvaShapeV1 } from "../../schemas/konvaShapes";
import { isKonvaGroupShape } from "../../schemas/konvaShapes";
import type { DiagramLiveSnapshot } from "./diagramBindingCatalog";
import {
  evaluateBindingGate,
  evaluateNumericProp,
  evaluateTextProp,
} from "./evaluateDiagramScene";

function clampOpacity(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function applyPropertyBinding(
  shape: Record<string, unknown>,
  property: string,
  binding: KonvaPropertyBindingValueV1,
  snapshot: DiagramLiveSnapshot,
): void {
  if (
    property === "text" &&
    typeof binding === "object" &&
    binding != null &&
    "binding" in binding &&
    !("path" in binding)
  ) {
    shape.text = evaluateTextProp(binding, snapshot);
    return;
  }

  if (isKonvaNumericPropertyBinding(binding)) {
    const value = evaluateNumericProp(binding, snapshot);
    if (property === "opacity") {
      shape.opacity = clampOpacity(value);
      return;
    }
    shape[property] = value;
    return;
  }

  if (isKonvaGateBinding(binding) && property === "visible") {
    shape.opacity = evaluateBindingGate(binding, snapshot) ? 1 : 0;
  }
}

/** Resolve live data into Konva shapes (layout values stay in stored JSON). */
export function evaluateKonvaShapes(
  freeform: DiagramKonvaFreeformV1,
  snapshot: DiagramLiveSnapshot,
): KonvaShapeV1[] {
  const bindings = freeform.propertyBindings ?? {};
  return freeform.shapes.map((shape) => evaluateKonvaShape(shape, bindings, snapshot));
}

function evaluateKonvaShape(
  shape: KonvaShapeV1,
  bindings: DiagramKonvaFreeformV1["propertyBindings"],
  snapshot: DiagramLiveSnapshot,
): KonvaShapeV1 {
  if (isKonvaGroupShape(shape)) {
    return {
      ...shape,
      children: shape.children.map((child) => evaluateKonvaShape(child, bindings, snapshot)),
    };
  }

  const shapeBindings = bindings?.[shape.id];
  if (shapeBindings == null || Object.keys(shapeBindings).length === 0) {
    return { ...shape };
  }
  const next: Record<string, unknown> = { ...shape };
  for (const [property, spec] of Object.entries(shapeBindings)) {
    applyPropertyBinding(next, property, spec, snapshot);
  }
  return next as KonvaShapeV1;
}
