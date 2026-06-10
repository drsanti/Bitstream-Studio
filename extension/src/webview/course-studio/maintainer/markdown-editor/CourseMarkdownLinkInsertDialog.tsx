import { useEffect, useMemo, useRef, useState } from "react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNInput } from "../../../ui/TRN/TRNInput";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import { listMarkdownLinkTargets } from "./markdownLinkTargets";
import { insertSnippet, type TextRange } from "./markdownEditorSelection";
import { useCoursePageEditorStore } from "../useCoursePageEditorStore";

export function CourseMarkdownLinkInsertDialog({
  open,
  onClose,
  text,
  selection,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  text: string;
  selection: TextRange;
  onApply: (nextText: string, nextSelection: TextRange) => void;
}) {
  const page = useCoursePageEditorStore((s) => s.page);
  const labelRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  const targets = useMemo(() => listMarkdownLinkTargets(page, text), [page, text]);
  const selectOptions = useMemo(
    () =>
      targets.map((target) => ({
        value: target.href,
        label: target.label,
      })),
    [targets],
  );

  const [selectedHref, setSelectedHref] = useState(() => selectOptions[0]?.value ?? "");

  useEffect(() => {
    if (!open) {
      return;
    }
    const initial = selectOptions[0]?.value ?? "";
    setSelectedHref(initial);
    if (urlRef.current != null) {
      urlRef.current.value = initial;
    }
    if (labelRef.current != null) {
      const selectedText = text.slice(selection.start, selection.end).trim();
      labelRef.current.value = selectedText || "link";
    }
  }, [open, selectOptions, selection.end, selection.start, text]);

  if (!open) {
    return null;
  }

  const insert = (label: string, href: string) => {
    const safeLabel = label.length > 0 ? label : "link";
    const safeHref = href.trim();
    if (safeHref.length === 0) {
      return;
    }
    const markdown = `[${safeLabel}](${safeHref})`;
    const result = insertSnippet(text, selection, markdown, {
      start: selection.start + 1,
      end: selection.start + 1 + safeLabel.length,
    });
    onApply(result.text, result.selection);
    onClose();
  };

  return (
    <div className="course-md-editor-link-dialog flex flex-wrap items-end gap-2 border-b border-[var(--surface-border)] bg-[var(--surface-panel)] px-2 py-2">
      <TRNFormField id="course-md-link-target" label="Target" className="min-w-[10rem] flex-[2]">
        <TRNSelect
          value={selectedHref}
          ariaLabel="Link target"
          options={selectOptions}
          onValueChange={(value) => {
            setSelectedHref(value);
            if (urlRef.current != null) {
              urlRef.current.value = value;
            }
            const target = targets.find((entry) => entry.href === value);
            if (target != null && labelRef.current != null && labelRef.current.value === "link") {
              labelRef.current.value = target.label;
            }
          }}
        />
      </TRNFormField>
      <TRNFormField id="course-md-link-label" label="Label" className="min-w-[8rem] flex-1">
        <TRNInput
          ref={labelRef}
          id="course-md-link-label"
          variant="outlined"
          size="sm"
          defaultValue="link"
        />
      </TRNFormField>
      <TRNFormField id="course-md-link-url" label="URL or path" className="min-w-[12rem] flex-[2]">
        <TRNInput
          ref={urlRef}
          id="course-md-link-url"
          variant="outlined"
          size="sm"
          defaultValue={selectedHref}
          placeholder="https:// or lesson.theory.md"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
            if (event.key === "Enter") {
              event.preventDefault();
              const label = labelRef.current?.value.trim() || "link";
              const href = urlRef.current?.value.trim() ?? "";
              insert(label, href);
            }
          }}
        />
      </TRNFormField>
      <TRNButton
        size="compact"
        onClick={() => {
          const label = labelRef.current?.value.trim() || "link";
          const href = urlRef.current?.value.trim() ?? "";
          insert(label, href);
        }}
      >
        Insert link
      </TRNButton>
      <TRNButton size="compact" onClick={onClose}>
        Cancel
      </TRNButton>
    </div>
  );
}
