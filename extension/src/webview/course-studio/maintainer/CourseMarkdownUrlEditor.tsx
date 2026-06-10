import { RefreshCw } from "lucide-react";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { resolveRemoteMarkdownFetchUrl } from "../content/remoteMarkdownUrl";
import { useRemoteMarkdown } from "../content/useRemoteMarkdown";
import type { MarkdownBlockColors } from "../schemas/markdownBlockColors";
import { CourseMarkdownBlockContent } from "../ui/catalog/CourseMarkdownBlockShell";
import { CourseMarkdownEditorShell } from "./markdown-editor/CourseMarkdownEditorShell";

export function CourseMarkdownUrlEditor({
  url,
  onUrlChange,
  embedded = false,
  showPreview = true,
  editorSurface = "inspector",
  colors,
}: {
  url: string;
  onUrlChange: (url: string) => void;
  embedded?: boolean;
  showPreview?: boolean;
  editorSurface?: "workbench" | "inspector";
  colors?: MarkdownBlockColors;
}) {
  const trimmed = url.trim();
  const { markdown, loading, error, reload } = useRemoteMarkdown(trimmed.length > 0 ? trimmed : undefined);
  const fetchUrl = trimmed.length > 0 ? resolveRemoteMarkdownFetchUrl(trimmed) : "";

  const urlHeader = (
    <div className="flex flex-col gap-2 border-b border-[var(--surface-border)] px-3 py-2">
      <TRNHintText>
        Remote markdown URL — content is read-only here. Edit the URL in Inspector → Content.
      </TRNHintText>
      <TRNFormField id="course-md-remote-url" label="Remote URL">
        <TRNInput
          id="course-md-remote-url"
          variant="outlined"
          size="sm"
          className="w-full"
          value={url}
          placeholder="https://github.com/user/repo"
          onChange={(event) => onUrlChange(event.target.value)}
        />
      </TRNFormField>
      {fetchUrl.length > 0 && fetchUrl !== trimmed ? (
        <TRNHintText>
          Fetches from{" "}
          <code className="break-all text-[var(--accent-cyan)]">{fetchUrl}</code>
        </TRNHintText>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <TRNButton
          size="compact"
          disabled={trimmed.length === 0 || loading}
          onClick={() => reload()}
        >
          <RefreshCw size={13} strokeWidth={2} className="mr-1 inline" />
          {loading ? "Loading…" : "Reload"}
        </TRNButton>
      </div>
    </div>
  );

  const previewBody =
    loading ? (
      <p className="text-[11px] text-[var(--text-muted)]">Loading remote markdown…</p>
    ) : error != null ? (
      <p className="text-[11px] text-rose-300/90">{error}</p>
    ) : markdown != null ? (
      <CourseMarkdownBlockContent
        markdown={markdown}
        colors={colors}
        className="rounded-md border-0"
      />
    ) : (
      <p className="text-[11px] text-[var(--text-muted)]">Enter a URL to preview markdown.</p>
    );

  const editor = (
    <CourseMarkdownEditorShell
      key={trimmed || "empty-url"}
      value={markdown ?? ""}
      onChange={() => {}}
      readOnly
      variant={editorSurface === "workbench" ? "workbench" : "embedded"}
      enablePreview={showPreview}
      ariaLabel="Remote markdown preview"
      preview={previewBody}
      headerSlot={urlHeader}
    />
  );

  if (editorSurface === "workbench") {
    return editor;
  }

  const body = (
    <div className="flex flex-col gap-3">
      {embedded ? null : urlHeader}
      {editor}
    </div>
  );

  if (embedded) {
    return body;
  }

  return <div className="flex flex-col gap-3 border-t border-[var(--surface-border)] pt-4">{body}</div>;
}
