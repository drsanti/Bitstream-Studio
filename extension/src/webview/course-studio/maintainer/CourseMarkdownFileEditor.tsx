import { useEffect, useState } from "react";
import { Save, Undo2 } from "lucide-react";
import { toast } from "react-toastify";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField, TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { TRNTextarea } from "../../ui/TRN/TRNTextarea";
import { PresentationTheoryMarkdown } from "../../presentation/components/PresentationTheoryMarkdown";
import { getCourseMarkdownSourcePath, loadCourseMarkdown } from "../content/markdownRegistry";
import { saveCourseMarkdownDev } from "./saveCourseMarkdownDev";
import { useCourseMarkdownEditorStore } from "./useCourseMarkdownEditorStore";

export function CourseMarkdownFileEditor({
  src,
  embedded = false,
}: {
  src: string;
  embedded?: boolean;
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

  const body = (
    <div className="flex flex-col gap-3">
      <TRNHintText>
        External <code className="text-[var(--accent-cyan)]">{src}</code> — edit here, save to repo
        (dev only). Same KaTeX + admonition rendering as Presentation theory reader.
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
      <TRNFormField id={`md-edit-${src}`} label="Markdown">
        <TRNTextarea
          id={`md-edit-${src}`}
          variant="outlined"
          size="sm"
          className="w-full"
          rows={10}
          value={text}
          spellCheck={false}
          onChange={(e) => handleChange(e.target.value)}
        />
      </TRNFormField>
      <TRNHintText>
        Admonitions: {"> **Note:** …"}, {"> **Warning:** …"}, {"> **Tip:** …"} render as callouts
        in preview.
      </TRNHintText>
      <TRNFormField id={`md-preview-${src}`} label="Preview">
        <div className="scrollbar-hide max-h-48 overflow-y-auto rounded-md border border-zinc-700/80 bg-zinc-950/50 px-3 py-2">
          <PresentationTheoryMarkdown markdown={text} />
        </div>
      </TRNFormField>
      {dirty ? (
        <div className="flex flex-wrap gap-2">
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
      ) : null}
    </div>
  );

  if (embedded) {
    return (
      <TRNFormSection title="Markdown file" showHeading={false} className="border-0 bg-transparent p-0">
        {body}
      </TRNFormSection>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--surface-border)] pt-4">
      <TRNFormSection title="Markdown file" showHeading={false}>
        {body}
      </TRNFormSection>
    </div>
  );
}
