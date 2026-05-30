/**
 * Optional display-only fixes for common misspellings in filenames / folder names.
 * Keys must be lowercase (matched after normalizing each segment).
 */
const KNOWN_WORD_FIXES: Record<string, string> = {
  traninig: 'training',
};

/**
 * Formats raw model names for UI: splits on hyphens, underscores, and spaces,
 * applies light typo fixes, then title-cases each segment (numeric segments unchanged).
 *
 * @example
 * formatModelDisplayName('plc-traninig-kit') // 'Plc Training Kit'
 * formatModelDisplayName('plc traninig kit') // 'Plc Training Kit'
 */
export function formatModelDisplayName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  const words = trimmed
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());

  return words
    .map((w) => {
      const fixed = KNOWN_WORD_FIXES[w] ?? w;
      if (/^\d+(\.\d+)?$/.test(fixed)) {
        return fixed;
      }
      if (fixed.length === 0) {
        return fixed;
      }
      return fixed.charAt(0).toUpperCase() + fixed.slice(1);
    })
    .join(' ');
}
