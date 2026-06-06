type EyeDropperOpenResult = { sRGBHex: string };
type EyeDropperInstance = { open(): Promise<EyeDropperOpenResult> };
type EyeDropperConstructor = new () => EyeDropperInstance;

function readEyeDropperConstructor(): EyeDropperConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const ctor = (window as Window & { EyeDropper?: EyeDropperConstructor }).EyeDropper;
  return typeof ctor === "function" ? ctor : null;
}

/** Browser EyeDropper API (Chromium / VS Code webview). */
export function isEyeDropperSupported(): boolean {
  return readEyeDropperConstructor() != null;
}

/**
 * Opens the OS eyedropper. Resolves with `#rrggbb` or `null` when unsupported or cancelled.
 */
export async function sampleScreenColorHex(): Promise<string | null> {
  const Ctor = readEyeDropperConstructor();
  if (Ctor == null) {
    return null;
  }
  try {
    const dropper = new Ctor();
    const result = await dropper.open();
    const hex = result?.sRGBHex;
    if (typeof hex === "string" && /^#[0-9a-fA-F]{6}$/.test(hex)) {
      return hex.toLowerCase();
    }
  } catch {
    // User cancelled or picker aborted.
  }
  return null;
}
