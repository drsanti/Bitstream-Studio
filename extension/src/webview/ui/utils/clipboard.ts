export async function readClipboardText(): Promise<string | null> {
  try {
    const text = await navigator.clipboard.readText();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

export async function writeClipboardText(text: string): Promise<boolean> {
  const normalized = text.replace(/\n$/, "");
  if (!normalized) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(normalized);
    return true;
  } catch {
    // Fallback for environments where Clipboard API is restricted.
    try {
      const el = document.createElement("textarea");
      el.value = normalized;
      el.style.position = "fixed";
      el.style.left = "-9999px";
      el.style.top = "-9999px";
      document.body.appendChild(el);
      el.focus();
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

