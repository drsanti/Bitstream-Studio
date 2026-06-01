/** Max visible characters for string values on flow socket rows. */
export const SOCKET_STRING_PREVIEW_MAX_LEN = 14;

export function truncateSocketStringPreview(value: string, maxLen = SOCKET_STRING_PREVIEW_MAX_LEN): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLen) {
    return trimmed;
  }
  if (maxLen <= 1) {
    return "…";
  }
  return `${trimmed.slice(0, maxLen - 1)}…`;
}
