export type MathOperation =
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "sin"
  | "cos"
  | "abs"
  | "pow"
  | "min"
  | "max"
  | "mod"
  | "floor"
  | "ceil";

export const MATH_OPERATION_OPTIONS: ReadonlyArray<{ value: MathOperation; label: string }> = [
  { value: "add", label: "Add (+)" },
  { value: "sub", label: "Subtract (−)" },
  { value: "mul", label: "Multiply (×)" },
  { value: "div", label: "Divide (÷)" },
  { value: "sin", label: "Sine (sin)" },
  { value: "cos", label: "Cosine (cos)" },
  { value: "abs", label: "Absolute (abs)" },
  { value: "pow", label: "Power (pow)" },
  { value: "min", label: "Minimum (min)" },
  { value: "max", label: "Maximum (max)" },
  { value: "mod", label: "Modulo (%)" },
  { value: "floor", label: "Floor" },
  { value: "ceil", label: "Ceil" },
];

const DIV_EPS = 1e-9;

export function normalizeMathOperation(op: string | undefined): MathOperation {
  const found = MATH_OPERATION_OPTIONS.find((o) => o.value === op);
  return found?.value ?? "add";
}

export function isUnaryMathOperation(op: string | undefined): boolean {
  const normalized = normalizeMathOperation(op);
  return normalized === "sin" || normalized === "cos" || normalized === "abs" || normalized === "floor" || normalized === "ceil";
}

function finiteOrZero(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/** Evaluate a math op on finite inputs; unwired callers should pass 0 for missing pins. */
export function evaluateMathOperation(op: string | undefined, a: number, b: number): number {
  const operation = normalizeMathOperation(op);
  const A = finiteOrZero(a);
  const B = finiteOrZero(b);

  switch (operation) {
    case "add":
      return A + B;
    case "sub":
      return A - B;
    case "mul":
      return A * B;
    case "div":
      return Math.abs(B) < DIV_EPS ? 0 : finiteOrZero(A / B);
    case "pow":
      return finiteOrZero(Math.pow(A, B));
    case "min":
      return Math.min(A, B);
    case "max":
      return Math.max(A, B);
    case "mod":
      return Math.abs(B) < DIV_EPS ? 0 : finiteOrZero(A % B);
    case "sin":
      return finiteOrZero(Math.sin(A));
    case "cos":
      return finiteOrZero(Math.cos(A));
    case "abs":
      return Math.abs(A);
    case "floor":
      return Math.floor(A);
    case "ceil":
      return Math.ceil(A);
    default:
      return A + B;
  }
}

export function mathOperationShortLabel(op: string | undefined): string {
  switch (normalizeMathOperation(op)) {
    case "add":
      return "+";
    case "sub":
      return "−";
    case "mul":
      return "×";
    case "div":
      return "÷";
    case "sin":
      return "sin";
    case "cos":
      return "cos";
    case "abs":
      return "abs";
    case "pow":
      return "pow";
    case "min":
      return "min";
    case "max":
      return "max";
    case "mod":
      return "%";
    case "floor":
      return "floor";
    case "ceil":
      return "ceil";
    default:
      return "+";
  }
}
