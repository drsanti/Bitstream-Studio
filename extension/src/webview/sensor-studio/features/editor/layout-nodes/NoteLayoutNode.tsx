import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { StickyNote } from "lucide-react";
import type { NoteLayoutNodeData } from "../layout/layout-flow-nodes.types";
import { useFlowEditorStore } from "../store/flow-editor.store";
import { TRNMarkdownRenderer } from "../../../../ui/TRN/TRNMarkdownRenderer";

const NOTE_MARKDOWN_CLASS =
  "pointer-events-none max-w-none px-3 py-2 text-[10px] leading-relaxed text-yellow-200/70 " +
  "[&_strong]:font-medium [&_strong]:text-yellow-100/85 " +
  "[&_em]:text-yellow-100/75 " +
  "[&_a]:text-yellow-200/80 [&_a]:underline [&_a]:decoration-yellow-200/30 " +
  "[&_code]:rounded [&_code]:border [&_code]:border-yellow-500/15 [&_code]:bg-black/15 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[10px] [&_code]:text-yellow-100/80 " +
  "[&_pre]:my-2 [&_pre]:rounded [&_pre]:border [&_pre]:border-yellow-500/15 [&_pre]:bg-black/20 [&_pre]:p-2 [&_pre]:overflow-auto " +
  "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:space-y-0.5 [&_ul]:pl-4 " +
  "[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:space-y-0.5 [&_ol]:pl-4 " +
  "[&_h1]:mt-2 [&_h1]:mb-1 [&_h1]:text-[11px] [&_h1]:font-semibold [&_h1]:text-yellow-100/90 " +
  "[&_h2]:mt-2 [&_h2]:mb-1 [&_h2]:text-[11px] [&_h2]:font-semibold [&_h2]:text-yellow-100/90 " +
  "[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-[10px] [&_h3]:font-semibold [&_h3]:text-yellow-100/85 " +
  "[&_blockquote]:my-2 [&_blockquote]:rounded [&_blockquote]:border [&_blockquote]:border-yellow-500/15 [&_blockquote]:bg-black/15 [&_blockquote]:px-2 [&_blockquote]:py-1.5";

export const NoteLayoutNode = memo(function NoteLayoutNode(props: NodeProps) {
  const { id, selected } = props;
  const data = props.data as NoteLayoutNodeData;
  const label =
    typeof data.label === "string" && data.label.trim().length > 0 ? data.label : "Note";
  const updateLayoutNodeData = useFlowEditorStore((s) => s.updateLayoutNodeData);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) {
      return;
    }
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const onLabelChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateLayoutNodeData(id, { label: event.target.value });
    },
    [id, updateLayoutNodeData],
  );

  const onTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateLayoutNodeData(id, { text: event.target.value });
    },
    [id, updateLayoutNodeData],
  );

  const locked = Boolean(data.locked);

  const markdownPreset = data.markdownPreset ?? "note";
  const markdownLinkBehavior = data.markdownLinkBehavior ?? "open";
  const markdownShowHeadings = data.markdownShowHeadings ?? true;
  const markdownShowLinks = data.markdownShowLinks ?? true;
  const markdownShowLists = data.markdownShowLists ?? true;
  const markdownShowCode = data.markdownShowCode ?? true;
  const markdownShowTables = data.markdownShowTables ?? true;
  const markdownShowBlockquotes = data.markdownShowBlockquotes ?? true;
  const markdownEnableCodeCopy = data.markdownEnableCodeCopy ?? false;
  const markdownEnableSyntaxHighlight = data.markdownEnableSyntaxHighlight ?? false;
  const markdownEnableHtmlPreview = data.markdownEnableHtmlPreview ?? false;

  const markdownComponents = useMemo(() => {
    const overrides: Record<string, any> = {};
    if (!markdownShowHeadings) {
      overrides.h1 = ({ children, ...props }: any) => <p {...props}>{children}</p>;
      overrides.h2 = ({ children, ...props }: any) => <p {...props}>{children}</p>;
      overrides.h3 = ({ children, ...props }: any) => <p {...props}>{children}</p>;
      overrides.h4 = ({ children, ...props }: any) => <p {...props}>{children}</p>;
      overrides.h5 = ({ children, ...props }: any) => <p {...props}>{children}</p>;
      overrides.h6 = ({ children, ...props }: any) => <p {...props}>{children}</p>;
    }
    if (!markdownShowLinks || markdownLinkBehavior === "disabled") {
      overrides.a = ({ children }: any) => <span>{children}</span>;
    } else if (markdownLinkBehavior === "copy") {
      overrides.a = ({ href, children }: any) => (
        <button
          type="button"
          className="inline-flex items-baseline gap-1 underline decoration-yellow-200/30 underline-offset-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = typeof href === "string" ? href : "";
            if (url.length === 0) return;
            void navigator.clipboard?.writeText(url);
          }}
        >
          {children}
        </button>
      );
    } else {
      overrides.a = ({ href, children }: any) => (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => {
            // Avoid selecting/drags triggering navigation in canvas contexts.
            e.stopPropagation();
          }}
        >
          {children}
        </a>
      );
    }
    if (!markdownShowLists) {
      overrides.ul = ({ children }: any) => <div>{children}</div>;
      overrides.ol = ({ children }: any) => <div>{children}</div>;
      overrides.li = ({ children }: any) => <div>{children}</div>;
    }
    if (!markdownShowCode) {
      overrides.code = ({ children }: any) => <span>{children}</span>;
      overrides.pre = ({ children }: any) => <div>{children}</div>;
    }
    if (!markdownShowTables) {
      overrides.table = ({ children }: any) => <div>{children}</div>;
      overrides.thead = ({ children }: any) => <div>{children}</div>;
      overrides.tbody = ({ children }: any) => <div>{children}</div>;
      overrides.tr = ({ children }: any) => <div>{children}</div>;
      overrides.th = ({ children }: any) => <span className="font-semibold">{children}</span>;
      overrides.td = ({ children }: any) => <span>{children}</span>;
    }
    if (!markdownShowBlockquotes) {
      overrides.blockquote = ({ children }: any) => <div>{children}</div>;
    }
    return overrides;
  }, [
    markdownLinkBehavior,
    markdownShowBlockquotes,
    markdownShowCode,
    markdownShowHeadings,
    markdownShowLinks,
    markdownShowLists,
    markdownShowTables,
  ]);

  return (
    <div
      className={`studio-note-node flex min-w-[180px] max-w-[280px] flex-col rounded-xl ${
        selected ? "studio-flow-node--selected" : ""
      }`}
    >
      <div
        className="studio-note-node__header node-drag-handle flex h-7 cursor-move items-center gap-1.5 rounded-t-xl px-2.5"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        <StickyNote size={11} className="shrink-0 text-yellow-500/70" aria-hidden />
        {editing ? (
          <input
            ref={inputRef}
            value={label}
            onChange={onLabelChange}
            onBlur={() => setEditing(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setEditing(false);
              } else if (event.key === "Escape") {
                setEditing(false);
              }
            }}
            className="nodrag nopan pointer-events-auto min-w-0 flex-1 cursor-text bg-transparent text-[10px] font-semibold uppercase tracking-wider text-yellow-300/80 outline-none"
            placeholder="Note"
          />
        ) : (
          <div className="pointer-events-auto min-w-0 flex-1 select-none truncate text-[10px] font-semibold uppercase tracking-wider text-yellow-300/80">
            {label}
          </div>
        )}
      </div>
      {(data.text ?? "").trim().length > 0 ? (
        <TRNMarkdownRenderer
          markdown={data.text ?? ""}
          tone="neutral"
          preset={markdownPreset}
          enableZoom={false}
          enableCodeCopy={markdownEnableCodeCopy}
          enableSyntaxHighlight={markdownEnableSyntaxHighlight}
          enableHtmlPreview={markdownEnableHtmlPreview}
          components={markdownComponents}
          className={NOTE_MARKDOWN_CLASS}
        />
      ) : (
        <div className="pointer-events-none px-3 py-2 text-[10px] leading-relaxed text-yellow-900/60">
          {locked ? "Locked" : "Click to write…"}
        </div>
      )}
    </div>
  );
});
