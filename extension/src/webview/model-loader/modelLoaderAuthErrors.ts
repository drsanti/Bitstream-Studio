import { formatModelLoaderErrorMessage } from "./formatModelLoaderErrorMessage";

/**
 * Detects server rejection of credentials (typical: HTTP 401/403 from API / nginx).
 */
export function isLikelyInvalidApiKeyError(raw: string): boolean {
  const s = raw.toLowerCase();
  if (/\b401\b/.test(raw) || /\bhttp\s*401\b/i.test(raw)) {
    return true;
  }
  if (/\b403\b/.test(raw) || /\bhttp\s*403\b/i.test(raw)) {
    return true;
  }
  if (s.includes("unauthorized") || s.includes("not authorized")) {
    return true;
  }
  if (s.includes("invalid credentials") || s.includes("invalid api key")) {
    return true;
  }
  if (s.includes("invalid") && (s.includes("token") || s.includes("bearer"))) {
    return true;
  }
  if (s.includes("access denied") && (s.includes("api") || s.includes("key"))) {
    return true;
  }
  return false;
}

export interface InvalidApiKeyDialogCopy {
  title: string;
  body: string;
  /** Short sanitized snippet for “Technical detail” (optional). */
  detail?: string;
}

export function getInvalidApiKeyDialogCopy(rawError: string): InvalidApiKeyDialogCopy {
  const detail = formatModelLoaderErrorMessage(rawError, { maxLen: 280 });
  return {
    title: "API key was rejected",
    body: [
      "The server refused this request because the API key is missing, wrong, or no longer allowed.",
      "",
      "What to try:",
      "• Paste the correct key in **API Key** and click **Save Config**.",
      "• In VS Code, if you use a stored secret, leave the field blank to keep it — or enter a new key to replace it.",
      "• Confirm **Base URL** matches your environment (no typo, correct https).",
    ].join("\n"),
    detail: detail || undefined,
  };
}
