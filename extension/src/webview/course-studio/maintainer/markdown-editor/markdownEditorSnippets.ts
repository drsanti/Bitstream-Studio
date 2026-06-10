export type MarkdownSnippet = {
  id: string;
  label: string;
  hint: string;
  snippet: string;
  /** Cursor placement relative to snippet start after insert. */
  selection?: { start: number; end: number };
};

export const MARKDOWN_EDITOR_SNIPPETS: MarkdownSnippet[] = [
  {
    id: "lesson-intro",
    label: "Lesson intro",
    hint: "Title + overview section skeleton.",
    snippet: "# Lesson title\n\n## Overview\n\nIntroduce the topic.\n\n",
    selection: { start: 2, end: 14 },
  },
  {
    id: "objectives",
    label: "Learning objectives",
    hint: "Bulleted objectives list.",
    snippet: "## Objectives\n\n- Objective one\n- Objective two\n\n",
    selection: { start: 16, end: 30 },
  },
  {
    id: "summary",
    label: "Summary",
    hint: "Closing summary section.",
    snippet: "## Summary\n\nKey takeaways:\n\n- \n\n",
    selection: { start: 32, end: 32 },
  },
  {
    id: "quiz",
    label: "Check your understanding",
    hint: "Numbered review questions.",
    snippet: "## Check your understanding\n\n1. First question?\n2. Second question?\n\n",
    selection: { start: 30, end: 47 },
  },
  {
    id: "code-ts",
    label: "TypeScript code block",
    hint: "Fenced TypeScript example.",
    snippet: "```typescript\nconst value = 0;\n```\n\n",
    selection: { start: 14, end: 27 },
  },
  {
    id: "mermaid-flow",
    label: "Mermaid flowchart",
    hint: "Basic flowchart diagram block.",
    snippet: "```mermaid\nflowchart TD\n  A[Start] --> B[Process]\n  B --> C[End]\n```\n\n",
    selection: { start: 28, end: 33 },
  },
  {
    id: "mermaid-seq",
    label: "Mermaid sequence",
    hint: "Sequence diagram skeleton.",
    snippet: "```mermaid\nsequenceDiagram\n  participant A\n  participant B\n  A->>B: Message\n```\n\n",
    selection: { start: 42, end: 49 },
  },
  {
    id: "math-block",
    label: "Display math",
    hint: "KaTeX block delimiters.",
    snippet: "$$\nE = mc^2\n$$\n\n",
    selection: { start: 3, end: 12 },
  },
  {
    id: "admonition-note",
    label: "Note callout",
    hint: "Presentation Note admonition block.",
    snippet: "> **Note:** Explain the concept here.\n\n",
    selection: { start: 10, end: 33 },
  },
  {
    id: "admonition-warning",
    label: "Warning callout",
    hint: "Presentation Warning admonition block.",
    snippet: "> **Warning:** Caution the operator about this step.\n\n",
    selection: { start: 13, end: 49 },
  },
  {
    id: "sensor-live",
    label: "Live sensor mention",
    hint: "Inline reference to BMI270 live stream.",
    snippet: "Live **BMI270** accel/gyro samples appear in the telemetry deck when Bitstream mode is connected.\n\n",
    selection: { start: 5, end: 12 },
  },
  {
    id: "see-also",
    label: "See also link",
    hint: "Cross-link to another markdown file in content/.",
    snippet: "## See also\n\n- [Related lesson](pilot-bmi-accel-theory.theory.md)\n\n",
    selection: { start: 15, end: 29 },
  },
  {
    id: "table-3col",
    label: "3-column table",
    hint: "Markdown table skeleton (Tab moves across cells).",
    snippet: "| Parameter | Value | Unit |\n| --- | --- | --- |\n| Sample | 0 | m/s² |\n\n",
    selection: { start: 2, end: 11 },
  },
];
