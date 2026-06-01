export function readSwitchCondition(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0;
  }
  return false;
}

function finiteOrZero(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function finiteNumberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Pick ifTrue or ifFalse number based on condition; unwired branches count as 0. */
export function evaluateSwitchNumber(
  condition: unknown,
  ifTrue: unknown,
  ifFalse: unknown,
): number {
  return readSwitchCondition(condition)
    ? finiteNumberOrZero(ifTrue)
    : finiteNumberOrZero(ifFalse);
}

export type FlowWireVec3 = { x: number; y: number; z: number };

export function evaluateCombineXyz(x: number, y: number, z: number): FlowWireVec3 {
  return {
    x: finiteOrZero(x),
    y: finiteOrZero(y),
    z: finiteOrZero(z),
  };
}
