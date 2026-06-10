import { Save, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField, TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { COURSE_MARKDOWN_MATH_DELIMITERS } from "../../presentation/shared/presentationMarkdownPipeline";
import { getCourseMarkdownSourcePath, loadCourseMarkdown } from "../content/markdownRegistry";
import type { MarkdownBlockColors } from "../schemas/markdownBlockColors";
import { CourseMarkdownBlockContent } from "../ui/catalog/CourseMarkdownBlockShell";
import { CourseMarkdownEditorShell } from "./markdown-editor/CourseMarkdownEditorShell";
import { saveCourseMarkdownDev } from "./saveCourseMarkdownDev";
import { useCourseMarkdownEditorStore } from "./useCourseMarkdownEditorStore";

export function CourseMarkdownFileEditor({
  src,
  embedded = false,
  showPreview = true,
  editorSurface = "inspector",
  colors,
}: {
  src: string;
  embedded?: boolean;
  /** When false, preview is omitted (e.g. separate Preview inspector card). */
  showPreview?: boolean;
  /** Workbench pane uses full-height StackEdit-style shell. */
  editorSurface?: "workbench" | "inspector";
  colors?: MarkdownBlockColors;
}) {
  const draft = useCourseMarkdownEditorStore((s) => s.drafts[src]);
  const dirty = useCourseMarkdownEditorStore((s) => s.dirty[src] === true);
  const setDraftText = useCourseMarkdownEditorStore((s) => s.setDraftText);
  const discardMarkdown = useCourseMarkdownEditorStore((s) => s.discardMarkdown);
  const markMarkdownClean = useCourseMarkdownEditorStore((s) => s.markMarkdownClean);

  const baseline = draft ?? loadCourseMarkdown(src) ?? "";
  const [text, setText] = useState(baseline);
  const [saving, setSaving] = useState(false);
  const sourcePath = getCourseMarkdownSourcePath(src);

  useEffect(() => {
    if (!dirty) {
      setText(baseline);
    }
  }, [baseline, dirty, src]);

  const handleChange = (value: string) => {
    setText(value);
    setDraftText(src, value);
  };

  const handleSave = async () => {
    if (sourcePath == null) {
      toast.error(`Markdown "${src}" is not registered for dev save.`);
      return;
    }
    setSaving(true);
    try {
      const result = await saveCourseMarkdownDev(sourcePath, text);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      markMarkdownClean(src, text);
      toast.success("Markdown saved to repo");
    } finally {
      setSaving(false);
    }
  };

  const saveFooter =
    dirty ? (
      <div className="flex flex-wrap gap-2 border-t border-[var(--surface-border)] px-3 py-2">
        <TRNButton size="compact" onClick={() => discardMarkdown(src)}>
          <Undo2 size={13} strokeWidth={2} className="mr-1 inline" />
          Discard file edits
        </TRNButton>
        <TRNButton
          size="compact"
          className="border-amber-500/40 bg-amber-500/15"
          disabled={saving || sourcePath == null}
          onClick={() => void handleSave()}
        >
          <Save size={13} strokeWidth={2} className="mr-1 inline" />
          {saving ? "Saving…" : "Save markdown"}
        </TRNButton>
      </div>
    ) : null;

  const editor = (
    <CourseMarkdownEditorShell
      key={src}
      value={text}
      onChange={handleChange}
      dirty={dirty}
      variant={editorSurface === "workbench" ? "workbench" : "embedded"}
      enablePreview={showPreview}
      ariaLabel={`Markdown file ${src}`}
      preview={
        <CourseMarkdownBlockContent
          markdown={text}
          colors={colors}
          className="rounded-md border-0"
        />
      }
      headerSlot={
        editorSurface === "workbench" ? (
          <div className="flex flex-col gap-1 border-b border-[var(--surface-border)] px-3 py-2">
            <p className="text-[11px] text-[var(--text-muted)]">
              External{" "}
              <code className="text-[var(--accent-cyan)]">{src}</code> — save writes to repo (dev
              only).
            </p>
            {sourcePath != null ? (
              <p className="truncate text-[10px] text-[var(--text-muted)]">{sourcePath}</p>
            ) : null}
          </div>
        ) : undefined
      }
      footerSlot={saveFooter}
    />
  );

  if (editorSurface === "workbench") {
    return editor;
  }

  const inspectorMeta = (
    <div className="flex flex-col gap-3">
      <TRNHintText>
        External <code className="text-[var(--accent-cyan)]">{src}</code> — edit here, save to repo
        (dev only). Math uses StackEdit/Obsidian-style KaTeX ({COURSE_MARKDOWN_MATH_DELIMITERS.inline}{" "}
        inline, {COURSE_MARKDOWN_MATH_DELIMITERS.block} block).
      </TRNHintText>
      <TRNFormField id={`md-src-${src}`} label="Source file">
        <TRNInput
          id={`md-src-${src}`}
          variant="outlined"
          size="sm"
          className="w-full"
          value={sourcePath ?? src}
          readOnly
          disabled
        />
      </TRNFormField>
      {editor}
      {!showPreview ? (
        <TRNHintText>
          Preview lives in the Preview inspector card. Toolbar layout is saved in this browser.
        </TRNHintText>
      ) : null}
    </div>
  );

  if (embedded) {
    return (
      <TRNFormSection title="Markdown file" showHeading={false} className="border-0 bg-transparent p-0">
        {inspectorMeta}
      </TRNFormSection>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--surface-border)] pt-4">
      <TRNFormSection title="Markdown file" showHeading={false}>
        {inspectorMeta}
      </TRNFormSection>
    </div>
  );
}
