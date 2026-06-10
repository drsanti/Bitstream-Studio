import { RefreshCw } from "lucide-react";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { resolveRemoteHtmlFetchUrl } from "../content/remoteHtmlUrl";
import { useRemoteHtml } from "../content/useRemoteHtml";
import { CourseHtmlEditorShell } from "./html-editor/CourseHtmlEditorShell";

export function CourseHtmlPageUrlEditor({
  url,
  onUrlChange,
  embedded = false,
  editorSurface = "inspector",
  sandboxSameOrigin,
}: {
  url: string;
  onUrlChange: (url: string) => void;
  embedded?: boolean;
  editorSurface?: "workbench" | "inspector";
  sandboxSameOrigin?: boolean;
}) {
  const trimmed = url.trim();
  const { html, loading, error, reload } = useRemoteHtml(trimmed.length > 0 ? trimmed : undefined);
  const fetchUrl = trimmed.length > 0 ? resolveRemoteHtmlFetchUrl(trimmed) : "";

  const urlHeader = (
    <div className="flex flex-col gap-2 border-b border-[var(--surface-border)] px-3 py-2">
      <TRNHintText>
        Remote HTML URL — content is read-only here. Edit the URL in Inspector → Source.
      </TRNHintText>
      <TRNFormField id="course-html-remote-url" label="Remote URL">
        <TRNInput
          id="course-html-remote-url"
          variant="outlined"
          size="sm"
          className="w-full"
          value={url}
          placeholder="https://github.com/user/repo/blob/main/demo/page.html"
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
        <TRNButton size="compact" disabled={trimmed.length === 0 || loading} onClick={() => reload()}>
          <RefreshCw size={13} strokeWidth={2} className="mr-1 inline" />
          {loading ? "Loading…" : "Reload"}
        </TRNButton>
        {error != null ? <span className="text-[11px] text-rose-300/90">{error}</span> : null}
      </div>
    </div>
  );

  const editor = (
    <CourseHtmlEditorShell
      key={trimmed || "empty-url"}
      value={html ?? ""}
      onChange={() => {}}
      readOnly
      variant={editorSurface === "workbench" ? "workbench" : "embedded"}
      ariaLabel="Remote HTML preview"
      headerSlot={urlHeader}
      sandboxSameOrigin={sandboxSameOrigin}
    />
  );

  if (editorSurface === "workbench") {
    return editor;
  }

  const body = (
    <div className="flex flex-col gap-3">
      {embedded ? null : urlHeader}
      {loading ? (
        <p className="text-[11px] text-[var(--text-muted)]">Loading remote HTML…</p>
      ) : error != null ? (
        <p className="text-[11px] text-rose-300/90">{error}</p>
      ) : (
        editor
      )}
    </div>
  );

  if (embedded) {
    return body;
  }

  return <div className="flex flex-col gap-3 border-t border-[var(--surface-border)] pt-4">{body}</div>;
}
