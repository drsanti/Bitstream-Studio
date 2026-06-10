import { useRef } from "react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNInput } from "../../../ui/TRN/TRNInput";
import { insertSnippet, type TextRange } from "./markdownEditorSelection";

export function CourseMarkdownImageInsertDialog({
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
  const urlRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return null;
  }

  const insert = (markdown: string, selectStart: number, selectEnd: number) => {
    const result = insertSnippet(text, selection, markdown, {
      start: selection.start + selectStart,
      end: selection.start + selectEnd,
    });
    onApply(result.text, result.selection);
    onClose();
  };

  return (
    <div className="course-md-editor-image-dialog flex flex-wrap items-end gap-2 border-b border-[var(--surface-border)] bg-[var(--surface-panel)] px-2 py-2">
      <TRNFormField id="course-md-image-alt" label="Alt text" className="min-w-[8rem] flex-1">
        <TRNInput
          ref={altRef}
          id="course-md-image-alt"
          variant="outlined"
          size="sm"
          defaultValue="image"
        />
      </TRNFormField>
      <TRNFormField id="course-md-image-url" label="Image URL or path" className="min-w-[12rem] flex-[2]">
        <TRNInput
          ref={urlRef}
          id="course-md-image-url"
          variant="outlined"
          size="sm"
          placeholder="https:// or media/example.png"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
            if (event.key === "Enter") {
              event.preventDefault();
              const alt = altRef.current?.value.trim() || "image";
              const url = urlRef.current?.value.trim() ?? "";
              if (url.length === 0) {
                return;
              }
              insert(`![${alt}](${url})`, 2, 2 + alt.length);
            }
          }}
        />
      </TRNFormField>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file == null) {
            return;
          }
          void (async () => {
            const { resolvePastedImageMarkdown, imageMarkdownFromPaste } = await import(
              "./markdownEditorPasteImage"
            );
            const resolved = await resolvePastedImageMarkdown(file);
            const alt = altRef.current?.value.trim() || resolved.alt;
            const markdown = imageMarkdownFromPaste(resolved).replace(
              /^!\[[^\]]*\]/,
              `![${alt}]`,
            );
            insert(markdown, 2, 2 + alt.length);
          })();
        }}
      />
      <div className="flex flex-wrap gap-1 pb-0.5">
        <TRNButton
          size="compact"
          onClick={() => {
            const alt = altRef.current?.value.trim() || "image";
            const url = urlRef.current?.value.trim() ?? "";
            if (url.length === 0) {
              urlRef.current?.focus();
              return;
            }
            insert(`![${alt}](${url})`, 2, 2 + alt.length);
          }}
        >
          Insert
        </TRNButton>
        <TRNButton size="compact" onClick={() => fileRef.current?.click()}>
          Choose file
        </TRNButton>
        <TRNButton size="compact" onClick={onClose}>
          Cancel
        </TRNButton>
      </div>
    </div>
  );
}
