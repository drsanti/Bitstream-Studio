export type OnKeyModifierConfig = {
  requireCtrl: boolean;
  requireShift: boolean;
  requireAlt: boolean;
};

export type FlowKeyboardEventLike = {
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey?: boolean;
};

export function readOnKeyConfig(defaultConfig: Record<string, unknown>): {
  key: string;
  modifiers: OnKeyModifierConfig;
} {
  const keyRaw = defaultConfig.key;
  const key = typeof keyRaw === "string" && keyRaw.trim().length > 0 ? keyRaw.trim() : "KeyR";
  return {
    key,
    modifiers: {
      requireCtrl: defaultConfig.requireCtrl === true,
      requireShift: defaultConfig.requireShift === true,
      requireAlt: defaultConfig.requireAlt === true,
    },
  };
}

export function formatOnKeyLabel(keyCode: string): string {
  if (keyCode === "Space") {
    return "Space";
  }
  if (keyCode.startsWith("Key")) {
    return keyCode.slice(3);
  }
  if (keyCode.startsWith("Digit")) {
    return keyCode.slice(5);
  }
  if (keyCode.startsWith("Arrow")) {
    return keyCode.slice(5);
  }
  return keyCode;
}

export function keyboardEventMatchesOnKeyConfig(
  event: FlowKeyboardEventLike,
  defaultConfig: Record<string, unknown>,
): boolean {
  const { key, modifiers } = readOnKeyConfig(defaultConfig);
  if (event.code !== key) {
    return false;
  }
  const ctrl = event.ctrlKey || event.metaKey === true;
  if (modifiers.requireCtrl !== ctrl) {
    return false;
  }
  if (modifiers.requireShift !== event.shiftKey) {
    return false;
  }
  if (modifiers.requireAlt !== event.altKey) {
    return false;
  }
  return true;
}

export const ON_KEY_PRESET_OPTIONS = [
  { value: "KeyR", label: "R" },
  { value: "KeyT", label: "T" },
  { value: "KeyG", label: "G" },
  { value: "KeyH", label: "H" },
  { value: "KeyV", label: "V" },
  { value: "Space", label: "Space" },
  { value: "Digit1", label: "1" },
  { value: "Digit2", label: "2" },
  { value: "Digit3", label: "3" },
  { value: "ArrowUp", label: "Arrow up" },
  { value: "ArrowDown", label: "Arrow down" },
  { value: "ArrowLeft", label: "Arrow left" },
  { value: "ArrowRight", label: "Arrow right" },
] as const;
