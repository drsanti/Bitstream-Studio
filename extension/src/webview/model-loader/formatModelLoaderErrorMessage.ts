/**
 * Turns API / nginx HTML error bodies into short, readable UI text.
 * Avoids rendering multi-KB HTML in the inspector panel (layout thrash + noise).
 */
const HTTP_STATUS_LABEL: Record<string, string> = {
  "400": "Bad Request",
  "401": "Unauthorized",
  "403": "Forbidden",
  "404": "Not Found",
  "408": "Request Timeout",
  "429": "Too Many Requests",
  "500": "Internal Server Error",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
};

function looksLikeHtml(s: string): boolean {
  return /<!DOCTYPE\s+html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(s);
}

function stripHtmlToPlainText(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Prefer nginx / HTML error pages: extract human title if possible.
 */
function extractHtmlErrorSummary(html: string): string | undefined {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) {
    const t = stripHtmlToPlainText(h1[1]);
    if (t.length > 0 && t.length < 200) return t;
  }
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title?.[1]) {
    const t = stripHtmlToPlainText(title[1]);
    if (t.length > 0 && t.length < 200) return t;
  }
  return undefined;
}

export interface FormatModelLoaderErrorOptions {
  /** Max length for the primary message (before optional truncation note). */
  maxLen?: number;
}

export function formatModelLoaderErrorMessage(
  raw: string,
  options?: FormatModelLoaderErrorOptions
): string {
  const maxLen = options?.maxLen ?? 480;
  let s = raw.trim();
  if (!s) {
    return "";
  }

  // "Error: HTTP 503: <!DOCTYPE html>..." or "HTTP 503: ..."
  const httpPrefix = s.match(
    /^(?:Error:\s*)?HTTP\s+(\d{3})\s*:\s*([\s\S]*)$/i
  );
  if (httpPrefix) {
    const code = httpPrefix[1];
    const rest = (httpPrefix[2] ?? "").trim();
    const label = HTTP_STATUS_LABEL[code] ?? "HTTP error";
    if (looksLikeHtml(rest)) {
      const summary = extractHtmlErrorSummary(rest);
      if (summary) {
        return `HTTP ${code} (${label}): ${summary}`;
      }
      return `HTTP ${code} (${label}). The server returned an HTML error page — the service may be down or overloaded.`;
    }
    const plain = rest.length > 0 ? stripHtmlToPlainText(rest) : "";
    const combined = plain
      ? `HTTP ${code} (${label}): ${plain}`
      : `HTTP ${code} (${label})`;
    return combined.length > maxLen ? `${combined.slice(0, maxLen - 1)}…` : combined;
  }

  if (looksLikeHtml(s)) {
    const summary = extractHtmlErrorSummary(s);
    if (summary) {
      return summary.length > maxLen ? `${summary.slice(0, maxLen - 1)}…` : summary;
    }
    const plain = stripHtmlToPlainText(s);
    const short =
      plain.length > maxLen ? `${plain.slice(0, maxLen - 1)}…` : plain;
    return short || "Invalid HTML error response from server.";
  }

  if (s.length > maxLen) {
    return `${s.slice(0, maxLen - 1)}…`;
  }
  return s;
}
