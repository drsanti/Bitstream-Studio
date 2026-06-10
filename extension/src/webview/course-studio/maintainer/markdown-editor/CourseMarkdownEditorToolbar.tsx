import {
  ArrowUpDown,
  Bold,
  BookOpen,
  Calculator,
  Code2,
  Columns2,
  Eye,
  EyeOff,
  FileText,
  Heading,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Redo2,
  Search,
  Sigma,
  Smile,
  SquareCode,
  Strikethrough,
  Table2,
  Undo2,
} from "lucide-react";
import type { ReactNode } from "react";
import { TRNMenuPanel } from "../../../ui/TRN/TRNMenu";
import { TRNEmojiPickerPopover } from "../../../ui/TRN/TRNEmojiPickerPopover";
import {
  MARKDOWN_TOOLBAR_ACTION_META,
  type MarkdownToolbarActionId,
} from "./markdownEditorActions";
import { CourseMarkdownEditorIconButton } from "./CourseMarkdownEditorIconButton";
import { CourseMarkdownEditorToolbarCustomize } from "./CourseMarkdownEditorToolbarCustomize";
import type { MarkdownToolbarPrefsV1 } from "./markdownEditorToolbarPersistence";
import {
  visibleMarkdownToolbarActions,
} from "./markdownEditorToolbarPersistence";
import { MARKDOWN_EDITOR_SNIPPETS } from "./markdownEditorSnippets";

const ACTION_ICONS: Record<MarkdownToolbarActionId, ReactNode> = {
  undo: <Undo2 size={14} strokeWidth={2} aria-hidden />,
  redo: <Redo2 size={14} strokeWidth={2} aria-hidden />,
  bold: <Bold size={14} strokeWidth={2} aria-hidden />,
  italic: <Italic size={14} strokeWidth={2} aria-hidden />,
  heading: <Heading size={14} strokeWidth={2} aria-hidden />,
  strikethrough: <Strikethrough size={14} strokeWidth={2} aria-hidden />,
  bulletList: <List size={14} strokeWidth={2} aria-hidden />,
  orderedList: <ListOrdered size={14} strokeWidth={2} aria-hidden />,
  taskList: <ListTodo size={14} strokeWidth={2} aria-hidden />,
  blockquote: <Quote size={14} strokeWidth={2} aria-hidden />,
  inlineCode: <Code2 size={14} strokeWidth={2} aria-hidden />,
  codeFence: <SquareCode size={14} strokeWidth={2} aria-hidden />,
  table: <Table2 size={14} strokeWidth={2} aria-hidden />,
  link: <Link2 size={14} strokeWidth={2} aria-hidden />,
  image: <Image size={14} strokeWidth={2} aria-hidden />,
  emoji: <Smile size={14} strokeWidth={2} aria-hidden />,
  horizontalRule: <Minus size={14} strokeWidth={2} aria-hidden />,
  mathInline: <Calculator size={14} strokeWidth={2} aria-hidden />,
  mathBlock: <Sigma size={14} strokeWidth={2} aria-hidden />,
  admonition: <Quote size={14} strokeWidth={2} aria-hidden />,
  find: <Search size={14} strokeWidth={2} aria-hidden />,
};

function groupSeparatorBefore(id: MarkdownToolbarActionId): boolean {
  return (
    id === "bold" ||
    id === "bulletList" ||
    id === "table" ||
    id === "mathInline" ||
    id === "find"
  );
}

export function CourseMarkdownEditorToolbar({
  prefs,
  onPrefsChange,
  onAction,
  disabled,
  canUndo,
  canRedo,
  headingMenuOpen,
  onHeadingMenuOpenChange,
  admonitionMenuOpen,
  onAdmonitionMenuOpenChange,
  snippetsMenuOpen,
  onSnippetsMenuOpenChange,
  emojiMenuOpen,
  onEmojiMenuOpenChange,
  onInsertSnippet,
  onInsertEmoji,
}: {
  prefs: MarkdownToolbarPrefsV1;
  onPrefsChange: (prefs: MarkdownToolbarPrefsV1) => void;
  onAction: (id: MarkdownToolbarActionId, payload?: { headingLevel?: 1 | 2 | 3 | 4; admonitionVariant?: "Note" | "Tip" | "Warning" | "Danger" }) => void;
  disabled?: boolean;
  canUndo: boolean;
  canRedo: boolean;
  headingMenuOpen: boolean;
  onHeadingMenuOpenChange: (open: boolean) => void;
  admonitionMenuOpen: boolean;
  onAdmonitionMenuOpenChange: (open: boolean) => void;
  snippetsMenuOpen: boolean;
  onSnippetsMenuOpenChange: (open: boolean) => void;
  emojiMenuOpen: boolean;
  onEmojiMenuOpenChange: (open: boolean) => void;
  onInsertSnippet: (snippet: string, selection?: { start: number; end: number }) => void;
  onInsertEmoji: (emoji: string) => void;
}) {
  const visible = visibleMarkdownToolbarActions(prefs);

  return (
    <div className="course-md-editor-toolbar flex min-h-8 flex-wrap items-center gap-0 px-1.5 py-0.5">
      {visible.map((id) => {
        const meta = MARKDOWN_TOOLBAR_ACTION_META[id];
        const separator = groupSeparatorBefore(id);
        const isUndo = id === "undo";
        const isRedo = id === "redo";

        if (id === "heading") {
          return (
            <ToolbarGroup key={id} separator={separator}>
              <HeadingMenu
                open={headingMenuOpen}
                onOpenChange={onHeadingMenuOpenChange}
                disabled={disabled}
                onPick={(level) => onAction("heading", { headingLevel: level })}
              />
            </ToolbarGroup>
          );
        }

        if (id === "admonition") {
          return (
            <ToolbarGroup key={id} separator={separator}>
              <AdmonitionMenu
                open={admonitionMenuOpen}
                onOpenChange={onAdmonitionMenuOpenChange}
                disabled={disabled}
                onPick={(variant) => onAction("admonition", { admonitionVariant: variant })}
              />
            </ToolbarGroup>
          );
        }

        if (id === "emoji") {
          return (
            <ToolbarGroup key={id} separator={separator}>
              <EmojiMenu
                open={emojiMenuOpen}
                onOpenChange={onEmojiMenuOpenChange}
                disabled={disabled}
                onPick={onInsertEmoji}
              />
            </ToolbarGroup>
          );
        }

        return (
          <ToolbarGroup key={id} separator={separator}>
            <CourseMarkdownEditorIconButton
              hint={meta.hint}
              ariaLabel={meta.label}
              disabled={disabled || (isUndo && !canUndo) || (isRedo && !canRedo)}
              onClick={() => onAction(id)}
            >
              {ACTION_ICONS[id]}
            </CourseMarkdownEditorIconButton>
          </ToolbarGroup>
        );
      })}
      <div className="ml-auto flex items-center gap-0.5 pl-1">
        <SnippetsMenu
          open={snippetsMenuOpen}
          onOpenChange={onSnippetsMenuOpenChange}
          disabled={disabled}
          onPick={onInsertSnippet}
        />
        <CourseMarkdownEditorToolbarCustomize onPrefsChange={onPrefsChange} />
      </div>
    </div>
  );
}

function ToolbarGroup({ separator, children }: { separator: boolean; children: ReactNode }) {
  return (
    <>
      {separator ? (
        <span className="course-md-editor-toolbar-sep mx-0.5 h-4 w-px shrink-0" aria-hidden />
      ) : null}
      {children}
    </>
  );
}

function HeadingMenu({
  open,
  onOpenChange,
  disabled,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onPick: (level: 1 | 2 | 3 | 4) => void;
}) {
  return (
    <div className="relative">
      <CourseMarkdownEditorIconButton
        hint={MARKDOWN_TOOLBAR_ACTION_META.heading.hint}
        ariaLabel={MARKDOWN_TOOLBAR_ACTION_META.heading.label}
        selected={open}
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
      >
        {ACTION_ICONS.heading}
      </CourseMarkdownEditorIconButton>
      {open ? (
        <>
          <div className="fixed inset-0 z-[1090]" onPointerDown={() => onOpenChange(false)} />
          <div className="absolute left-0 top-full z-[1100] mt-1">
            <TRNMenuPanel tone="glass-dropdown" className="min-w-[8rem] p-1 scrollbar-hide">
              {([1, 2, 3, 4] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  className="flex w-full rounded-md px-2 py-1.5 text-left text-[11px] text-[var(--text-primary)] hover:bg-white/10"
                  onClick={() => {
                    onPick(level);
                    onOpenChange(false);
                  }}
                >
                  Heading {level}
                </button>
              ))}
            </TRNMenuPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SnippetsMenu({
  open,
  onOpenChange,
  disabled,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onPick: (snippet: string, selection?: { start: number; end: number }) => void;
}) {
  return (
    <div className="relative">
      <CourseMarkdownEditorIconButton
        hint="Insert lesson templates and diagram skeletons."
        ariaLabel="Snippets"
        selected={open}
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
      >
        <BookOpen size={14} strokeWidth={2} aria-hidden />
      </CourseMarkdownEditorIconButton>
      {open ? (
        <>
          <div className="fixed inset-0 z-[1090]" onPointerDown={() => onOpenChange(false)} />
          <div className="absolute right-0 top-full z-[1100] mt-1">
            <TRNMenuPanel
              tone="glass-dropdown"
              className="max-h-64 min-w-[12rem] overflow-y-auto p-1 scrollbar-hide"
            >
              {MARKDOWN_EDITOR_SNIPPETS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="flex w-full flex-col rounded-md px-2 py-1.5 text-left hover:bg-white/10"
                  onClick={() => {
                    onPick(entry.snippet, entry.selection);
                    onOpenChange(false);
                  }}
                >
                  <span className="text-[11px] text-[var(--text-primary)]">{entry.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{entry.hint}</span>
                </button>
              ))}
            </TRNMenuPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}

function EmojiMenu({
  open,
  onOpenChange,
  disabled,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onPick: (emoji: string) => void;
}) {
  return (
    <TRNEmojiPickerPopover
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
      onPick={onPick}
      trigger={({ open: menuOpen, disabled: menuDisabled, toggle }) => (
        <CourseMarkdownEditorIconButton
          hint={MARKDOWN_TOOLBAR_ACTION_META.emoji.hint}
          ariaLabel={MARKDOWN_TOOLBAR_ACTION_META.emoji.label}
          selected={menuOpen}
          disabled={menuDisabled}
          onClick={toggle}
        >
          {ACTION_ICONS.emoji}
        </CourseMarkdownEditorIconButton>
      )}
    />
  );
}

function AdmonitionMenu({
  open,
  onOpenChange,
  disabled,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onPick: (variant: "Note" | "Tip" | "Warning" | "Danger") => void;
}) {
  const variants = ["Note", "Tip", "Warning", "Danger"] as const;
  return (
    <div className="relative">
      <CourseMarkdownEditorIconButton
        hint={MARKDOWN_TOOLBAR_ACTION_META.admonition.hint}
        ariaLabel={MARKDOWN_TOOLBAR_ACTION_META.admonition.label}
        selected={open}
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
      >
        {ACTION_ICONS.admonition}
      </CourseMarkdownEditorIconButton>
      {open ? (
        <>
          <div className="fixed inset-0 z-[1090]" onPointerDown={() => onOpenChange(false)} />
          <div className="absolute left-0 top-full z-[1100] mt-1">
            <TRNMenuPanel tone="glass-dropdown" className="min-w-[9rem] p-1 scrollbar-hide">
              {variants.map((variant) => (
                <button
                  key={variant}
                  type="button"
                  className="flex w-full rounded-md px-2 py-1.5 text-left text-[11px] text-[var(--text-primary)] hover:bg-white/10"
                  onClick={() => {
                    onPick(variant);
                    onOpenChange(false);
                  }}
                >
                  {variant}
                </button>
              ))}
            </TRNMenuPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function CourseMarkdownEditorPaneControls({
  viewMode,
  onViewModeChange,
  syncScroll,
  onSyncScrollChange,
  previewHidden,
  onPreviewHiddenChange,
  showOutlineToggle = false,
  outlineVisible = true,
  onOutlineVisibleChange,
}: {
  viewMode: "edit" | "split" | "preview";
  onViewModeChange: (mode: "edit" | "split" | "preview") => void;
  syncScroll: boolean;
  onSyncScrollChange: (enabled: boolean) => void;
  previewHidden: boolean;
  onPreviewHiddenChange: (hidden: boolean) => void;
  showOutlineToggle?: boolean;
  outlineVisible?: boolean;
  onOutlineVisibleChange?: (visible: boolean) => void;
}) {
  return (
    <div className="course-md-editor-pane-controls flex shrink-0 items-center justify-end gap-0 px-1.5 py-0.5">
      <CourseMarkdownEditorIconButton
        hint="Edit only — source pane fills the editor."
        ariaLabel="Edit only"
        selected={viewMode === "edit"}
        onClick={() => onViewModeChange("edit")}
      >
        <FileText size={14} strokeWidth={2} aria-hidden />
      </CourseMarkdownEditorIconButton>
      <CourseMarkdownEditorIconButton
        hint="Split — source and preview side by side."
        ariaLabel="Split view"
        selected={viewMode === "split"}
        onClick={() => onViewModeChange("split")}
      >
        <Columns2 size={14} strokeWidth={2} aria-hidden />
      </CourseMarkdownEditorIconButton>
      <CourseMarkdownEditorIconButton
        hint="Preview only — rendered markdown."
        ariaLabel="Preview only"
        selected={viewMode === "preview"}
        onClick={() => onViewModeChange("preview")}
      >
        <BookOpen size={14} strokeWidth={2} aria-hidden />
      </CourseMarkdownEditorIconButton>
      <span className="course-md-editor-toolbar-sep mx-1 h-4 w-px shrink-0" aria-hidden />
      <CourseMarkdownEditorIconButton
        hint="Sync scroll — bind editor and preview scroll positions."
        ariaLabel="Sync scroll"
        selected={syncScroll}
        onClick={() => onSyncScrollChange(!syncScroll)}
      >
        <ArrowUpDown size={14} strokeWidth={2} aria-hidden />
      </CourseMarkdownEditorIconButton>
      <CourseMarkdownEditorIconButton
        hint="Hide preview pane while in split mode."
        ariaLabel={previewHidden ? "Show preview pane" : "Hide preview pane"}
        selected={previewHidden}
        disabled={viewMode !== "split"}
        onClick={() => onPreviewHiddenChange(!previewHidden)}
      >
        {previewHidden ? (
          <EyeOff size={14} strokeWidth={2} aria-hidden />
        ) : (
          <Eye size={14} strokeWidth={2} aria-hidden />
        )}
      </CourseMarkdownEditorIconButton>
      {showOutlineToggle && onOutlineVisibleChange != null ? (
        <>
          <span className="course-md-editor-toolbar-sep mx-1 h-4 w-px shrink-0" aria-hidden />
          <CourseMarkdownEditorIconButton
            hint="Heading outline — jump to sections in the source pane."
            ariaLabel={outlineVisible ? "Hide heading outline" : "Show heading outline"}
            selected={outlineVisible}
            onClick={() => onOutlineVisibleChange(!outlineVisible)}
          >
            <List size={14} strokeWidth={2} aria-hidden />
          </CourseMarkdownEditorIconButton>
        </>
      ) : null}
    </div>
  );
}
