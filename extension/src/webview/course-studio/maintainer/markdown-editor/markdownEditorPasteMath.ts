/** Common when copying from Wikipedia, arXiv HTML, or equation images with "Copy LaTeX". */
const LATEX_COMMAND =
  /\\(?:frac|sqrt|sum|int|prod|lim|mathbf|mathrm|mathit|text|approx|ne|neq|pm|mp|cdot|times|div|alpha|beta|gamma|delta|theta|lambda|sigma|vec|hat|bar|left|right|begin|end|over|under|le|ge|equiv|infty|partial|nabla|ldots|quad|qquad|displaystyle|operatorname|mathbb|mathcal)\b/;

export function isAlreadyMathDelimited(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) {
    return false;
  }
  if (trimmed.startsWith("$$") && trimmed.endsWith("$$")) {
    return true;
  }
  if (trimmed.startsWith("$") && trimmed.endsWith("$") && !trimmed.startsWith("$$")) {
    return true;
  }
  return false;
}

export function looksLikeRawLatex(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (isAlreadyMathDelimited(trimmed)) {
    return false;
  }
  // Skip obvious non-math (URLs, markdown headings, code fences).
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("#") || trimmed.startsWith("```")) {
    return false;
  }
  const commandMatches = trimmed.match(/\\[a-zA-Z]+/g);
  if (commandMatches != null && commandMatches.length >= 2) {
    return true;
  }
  if (LATEX_COMMAND.test(trimmed)) {
    return true;
  }
  if (/\\[(\[{]/.test(trimmed)) {
    return true;
  }
  return false;
}

export function shouldWrapPastedLatexAsDisplay(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.includes("\n")) {
    return true;
  }
  if (/\\begin\{/.test(trimmed)) {
    return true;
  }
  if (/\\\\/.test(trimmed)) {
    return true;
  }
  if (trimmed.length > 56) {
    return true;
  }
  if (/\\frac|\\sum|\\int|\\sqrt|\\displaystyle/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Wrap pasted raw LaTeX with StackEdit/Obsidian delimiters when missing.
 * Returns the original string when no wrap is applied.
 */
export function wrapPastedLatexForMarkdown(raw: string): string {
  if (!looksLikeRawLatex(raw)) {
    return raw;
  }
  const inner = raw.trim();
  if (shouldWrapPastedLatexAsDisplay(inner)) {
    return `\n$$\n${inner}\n$$\n`;
  }
  return `$${inner}$`;
}
