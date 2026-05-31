export type OnClickButton = "left" | "right";

export type FlowPointerEventLike = {
  button: number;
};

export function readOnClickConfig(defaultConfig: Record<string, unknown>): {
  button: OnClickButton;
} {
  return {
    button: defaultConfig.button === "right" ? "right" : "left",
  };
}

export function formatOnClickButtonLabel(button: OnClickButton): string {
  return button === "right" ? "Right click" : "Left click";
}

export function pointerEventMatchesOnClickConfig(
  event: FlowPointerEventLike,
  defaultConfig: Record<string, unknown>,
): boolean {
  const { button } = readOnClickConfig(defaultConfig);
  if (button === "right") {
    return event.button === 2;
  }
  return event.button === 0;
}

export const ON_CLICK_BUTTON_OPTIONS = [
  { value: "left", label: "Left click (empty canvas)" },
  { value: "right", label: "Right click (empty canvas)" },
] as const;
