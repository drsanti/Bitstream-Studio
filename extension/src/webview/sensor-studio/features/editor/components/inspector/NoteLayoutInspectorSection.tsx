import {
  TRNButton,
  TRNFormField,
  TRNHintText,
  TRNIconButton,
  TRNSelect,
  TRNToggleSwitch,
  TRNTooltip,
} from "../../../../../ui/TRN";
import { Copy, Lock, RotateCcw, SendToBack, BringToFront, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { NoteLayoutNodeData } from "../../layout/layout-flow-nodes.types";
import { useFlowEditorStore } from "../../store/flow-editor.store";

type NoteLayoutInspectorSectionProps = {
  noteNodeId: string;
  data: NoteLayoutNodeData;
};

const MARKDOWN_PRESET_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "note", label: "Note" },
  { value: "inspector", label: "Inspector" },
] as const;

const MARKDOWN_LINK_BEHAVIOR_OPTIONS = [
  { value: "open", label: "Open (new tab)" },
  { value: "copy", label: "Copy URL (no navigation)" },
  { value: "disabled", label: "Disabled (render as text)" },
] as const;

const NOTE_WIDTH_PRESET_OPTIONS = [
  { value: "sm", label: "Small (200px)", width: 200 },
  { value: "md", label: "Medium (260px)", width: 260 },
  { value: "lg", label: "Large (320px)", width: 320 },
] as const;

export function NoteLayoutInspectorSection(props: NoteLayoutInspectorSectionProps) {
  const { noteNodeId, data } = props;
  const updateLayoutNodeData = useFlowEditorStore((s) => s.updateLayoutNodeData);
  const updateLayoutFlowNode = useFlowEditorStore((s) => s.updateLayoutFlowNode);
  const raiseLayoutNode = useFlowEditorStore((s) => s.raiseLayoutNode);
  const lowerLayoutNode = useFlowEditorStore((s) => s.lowerLayoutNode);
  const nodes = useFlowEditorStore((s) => s.nodes);
  const selectedNotes = useMemo(
    () => nodes.filter((n) => n.type === "studio-note" && Boolean(n.selected)),
    [nodes],
  );

  const label =
    typeof data.label === "string" && data.label.trim().length > 0
      ? data.label
      : "Note";
  const text = data.text ?? "";
  const markdownPreset = data.markdownPreset ?? "note";
  const locked = Boolean(data.locked);
  const widthPreset = data.widthPreset ?? "sm";
  const markdownLinkBehavior = data.markdownLinkBehavior ?? "open";
  const markdownTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const setPatch = (patch: Partial<NoteLayoutNodeData>) => {
    updateLayoutNodeData(noteNodeId, patch as Record<string, unknown>);
  };

  const bool = (v: unknown, fallback = true) =>
    typeof v === "boolean" ? v : fallback;

  const rendererDefaults: Partial<NoteLayoutNodeData> = {
    markdownPreset: "note",
    markdownLinkBehavior: "open",
    markdownShowHeadings: true,
    markdownShowLinks: true,
    markdownShowLists: true,
    markdownShowCode: true,
    markdownShowTables: true,
    markdownShowBlockquotes: true,
    markdownEnableCodeCopy: false,
    markdownEnableSyntaxHighlight: false,
    markdownEnableHtmlPreview: false,
  };

  const currentRendererPatch: Partial<NoteLayoutNodeData> = {
    markdownPreset: data.markdownPreset ?? "note",
    markdownLinkBehavior: data.markdownLinkBehavior ?? "open",
    markdownShowHeadings: data.markdownShowHeadings ?? true,
    markdownShowLinks: data.markdownShowLinks ?? true,
    markdownShowLists: data.markdownShowLists ?? true,
    markdownShowCode: data.markdownShowCode ?? true,
    markdownShowTables: data.markdownShowTables ?? true,
    markdownShowBlockquotes: data.markdownShowBlockquotes ?? true,
    markdownEnableCodeCopy: data.markdownEnableCodeCopy ?? false,
    markdownEnableSyntaxHighlight: data.markdownEnableSyntaxHighlight ?? false,
    markdownEnableHtmlPreview: data.markdownEnableHtmlPreview ?? false,
  };

  useEffect(() => {
    if (locked) {
      return;
    }
    const el = markdownTextareaRef.current;
    if (el == null) {
      return;
    }
    // When a note becomes selected, bring the markdown editor into view and focus it.
    el.scrollIntoView({ block: "nearest" });
    el.focus();
  }, [noteNodeId, locked]);

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto scrollbar-hide">
      <TRNHintText className="text-[11px]">
        Selected note = Markdown edit mode. Deselect = rendered Markdown preview.
      </TRNHintText>

      <div className="space-y-2 border-b border-zinc-800/60 pb-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Layout
        </div>
        <div className="flex items-center justify-between rounded border border-zinc-700/70 bg-zinc-950/35 px-2.5 py-1.5">
          <span className="text-[11px] text-zinc-300">Lock note</span>
          <TRNToggleSwitch
            checked={locked}
            ariaLabel="Lock note"
            onCheckedChange={(next) => setPatch({ locked: next })}
          />
        </div>

        <TRNFormField label="Width preset" id={`note-${noteNodeId}-width`}>
          <TRNSelect
            ariaLabel="Note width preset"
            value={widthPreset}
            options={NOTE_WIDTH_PRESET_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            onValueChange={(next) => {
              const preset = next as NoteLayoutNodeData["widthPreset"];
              const meta = NOTE_WIDTH_PRESET_OPTIONS.find((o) => o.value === preset);
              setPatch({ widthPreset: preset });
              if (meta != null) {
                updateLayoutFlowNode(noteNodeId, { style: { width: meta.width } });
              }
            }}
          />
        </TRNFormField>

        <div className="flex flex-wrap gap-2">
          <TRNButton
            type="button"
            size="compact"
            prefixIcon={<BringToFront className="h-3.5 w-3.5" aria-hidden />}
            hint="Raise this note above other nodes."
            onClick={() => raiseLayoutNode(noteNodeId)}
          >
            Bring to front
          </TRNButton>
          <TRNButton
            type="button"
            size="compact"
            prefixIcon={<SendToBack className="h-3.5 w-3.5" aria-hidden />}
            hint="Lower this note behind other nodes (still above frames)."
            onClick={() => lowerLayoutNode(noteNodeId)}
          >
            Send to back
          </TRNButton>
        </div>
      </div>

      <TRNFormField label="Title" id={`note-${noteNodeId}-title`}>
        <input
          id={`note-${noteNodeId}-title`}
          value={label}
          onChange={(event) => setPatch({ label: event.target.value })}
          placeholder="Note"
          className="w-full rounded border border-zinc-700/80 bg-zinc-950/45 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-100 outline-none transition-colors focus-visible:border-cyan-500/60"
        />
      </TRNFormField>

      <TRNFormField label="Markdown content" id={`note-${noteNodeId}-markdown`}>
        <textarea
          id={`note-${noteNodeId}-markdown`}
          ref={markdownTextareaRef}
          value={text}
          onChange={(event) => setPatch({ text: event.target.value })}
          rows={8}
          placeholder="Write Markdown..."
          className="w-full resize-y rounded border border-zinc-700/80 bg-zinc-950/45 px-2.5 py-2 text-[11px] leading-relaxed text-zinc-200 outline-none transition-colors focus-visible:border-cyan-500/60"
        />
      </TRNFormField>

      <div className="flex flex-wrap items-center gap-2">
        <TRNTooltip
          placement="top-start"
          openDelayMs={450}
          triggerWrapper="span"
          triggerAriaLabel="Reset style"
          content="Restore default renderer settings for this note."
          trigger={
            <TRNIconButton
              icon={<RotateCcw className="h-4 w-4" aria-hidden />}
              label="Reset style"
              nativeTitle={false}
              onClick={() => setPatch(rendererDefaults)}
            />
          }
        />

        <TRNTooltip
          placement="top-start"
          openDelayMs={450}
          triggerWrapper="span"
          triggerAriaLabel="Apply to selected"
          content={
            selectedNotes.length <= 1
              ? "Select 2+ notes to apply a shared style."
              : `Apply this note's renderer settings to ${selectedNotes.length - 1} other selected notes.`
          }
          trigger={
            <TRNIconButton
              icon={<Copy className="h-4 w-4" aria-hidden />}
              label="Apply to selected"
              nativeTitle={false}
              disabled={selectedNotes.length <= 1}
              onClick={() => {
                for (const n of selectedNotes) {
                  if (n.id === noteNodeId) continue;
                  updateLayoutNodeData(n.id, currentRendererPatch as Record<string, unknown>);
                }
              }}
            />
          }
        />

        <TRNTooltip
          placement="top-start"
          openDelayMs={450}
          triggerWrapper="span"
          triggerAriaLabel="Clear note"
          content="Clear the markdown content for this note."
          trigger={
            <TRNIconButton
              icon={<Trash2 className="h-4 w-4" aria-hidden />}
              label="Clear note"
              nativeTitle={false}
              className="border-rose-500/30 bg-rose-950/25 text-rose-100 hover:bg-rose-950/35"
              onClick={() => setPatch({ text: "" })}
            />
          }
        />
      </div>

      <div className="space-y-2 border-t border-zinc-800/80 pt-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Markdown Renderer
        </div>
        <TRNFormField
          label="Preset"
          id={`note-${noteNodeId}-markdown-preset`}
          className="space-y-1.5"
        >
          <TRNSelect
            ariaLabel="Note markdown preset"
            value={markdownPreset}
            options={MARKDOWN_PRESET_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            onValueChange={(next) =>
              setPatch({
                markdownPreset: next as NoteLayoutNodeData["markdownPreset"],
              })
            }
          />
        </TRNFormField>

        <TRNFormField
          label="Link behavior"
          id={`note-${noteNodeId}-markdown-link-behavior`}
          className="space-y-1.5"
        >
          <TRNSelect
            ariaLabel="Note markdown link behavior"
            value={markdownLinkBehavior}
            options={MARKDOWN_LINK_BEHAVIOR_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            onValueChange={(next) =>
              setPatch({
                markdownLinkBehavior: next as NoteLayoutNodeData["markdownLinkBehavior"],
              })
            }
          />
        </TRNFormField>
      </div>

      <div className="space-y-2 border-t border-zinc-800/80 pt-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Elements
        </div>
        {[
          ["Headings", "markdownShowHeadings"],
          ["Links", "markdownShowLinks"],
          ["Lists", "markdownShowLists"],
          ["Code", "markdownShowCode"],
          ["Tables", "markdownShowTables"],
          ["Blockquotes", "markdownShowBlockquotes"],
        ].map(([labelText, key]) => (
          <div
            key={key}
            className="flex items-center justify-between rounded border border-zinc-700/70 bg-zinc-950/35 px-2.5 py-1.5"
          >
            <span className="text-[11px] text-zinc-300">{labelText}</span>
            <TRNToggleSwitch
              checked={bool((data as Record<string, unknown>)[key], true)}
              ariaLabel={`Toggle ${labelText.toLowerCase()} rendering`}
              onCheckedChange={(next) =>
                setPatch({ [key]: next } as Partial<NoteLayoutNodeData>)
              }
            />
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-zinc-800/80 pt-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Features
        </div>
        {[
          ["Code copy button", "markdownEnableCodeCopy", false],
          ["Syntax highlight", "markdownEnableSyntaxHighlight", false],
          ["HTML preview", "markdownEnableHtmlPreview", false],
        ].map(([labelText, key, fallback]) => (
          <div
            key={key}
            className="flex items-center justify-between rounded border border-zinc-700/70 bg-zinc-950/35 px-2.5 py-1.5"
          >
            <span className="text-[11px] text-zinc-300">{labelText}</span>
            <TRNToggleSwitch
              checked={bool((data as Record<string, unknown>)[key], Boolean(fallback))}
              ariaLabel={`Toggle ${labelText.toLowerCase()}`}
              onCheckedChange={(next) =>
                setPatch({ [key]: next } as Partial<NoteLayoutNodeData>)
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

