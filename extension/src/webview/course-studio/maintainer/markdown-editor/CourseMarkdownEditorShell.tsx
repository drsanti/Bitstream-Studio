import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { toast } from "react-toastify";
import {
  applyMarkdownToolbarAction,
  type MarkdownToolbarActionId,
} from "./markdownEditorActions";
import { CourseMarkdownEditorEmbeddedResizeHandle } from "./CourseMarkdownEditorEmbeddedResizeHandle";
import { CourseMarkdownEditorFindBar } from "./CourseMarkdownEditorFindBar";
import { CourseMarkdownEditorOutline } from "./CourseMarkdownEditorOutline";
import { CourseMarkdownImageInsertDialog } from "./CourseMarkdownImageInsertDialog";
import { CourseMarkdownLinkInsertDialog } from "./CourseMarkdownLinkInsertDialog";
import {
  continueMarkdownBlockOnEnter,
  handleMarkdownTableTab,
} from "./markdownEditorBlockContinuation";
import { buildMarkdownFindHighlight } from "./markdownSyntaxHighlightHtml";
import { loadMarkdownEditorEmbeddedHeightPx } from "./markdownEditorEmbeddedSize";
import { CourseMarkdownSyntaxBackdrop } from "./CourseMarkdownSyntaxBackdrop";
import {
  CourseMarkdownEditorPaneControls,
  CourseMarkdownEditorToolbar,
} from "./CourseMarkdownEditorToolbar";
import { handleMarkdownEditorKeyDown } from "./markdownEditorKeyboard";
import { MarkdownEditorPreviewNavigationContext } from "./MarkdownEditorPreviewNavigationContext";
import {
  imageMarkdownFromPaste,
  readClipboardImageFile,
  resolvePastedImageMarkdown,
} from "./markdownEditorPasteImage";
import { wrapPastedLatexForMarkdown } from "./markdownEditorPasteMath";
import { scrollEditorToLine } from "./markdownEditorScroll";
import {
  countWords,
  cursorLineColumn,
  insertSnippet,
  type FindQueryOptions,
  type TextRange,
} from "./markdownEditorSelection";
import {
  loadMarkdownToolbarPrefs,
  type MarkdownToolbarPrefsV1,
} from "./markdownEditorToolbarPersistence";
import {
  loadMarkdownEditorViewPrefs,
  saveMarkdownEditorViewPrefs,
  type MarkdownEditorViewMode,
} from "./markdownEditorViewPersistence";
import {
  markdownEditorFontSizeRem,
  nextMarkdownEditorZoom,
} from "./markdownEditorZoom";
import { COURSE_MARKDOWN_MATH_STATUS_LABEL } from "../../../presentation/shared/presentationMarkdownPipeline";
import { useMarkdownEditorHistory } from "./useMarkdownEditorHistory";

export type CourseMarkdownEditorShellProps = {
  value: string;
  onChange: (value: string) => void;
  preview: ReactNode;
  ariaLabel?: string;
  readOnly?: boolean;
  /** File or external markdown draft unsaved. */
  dirty?: boolean;
  /** Course page JSON unsaved (inline blocks). */
  pageDirty?: boolean;
  /** Compact chrome for inspector cards; workbench fills available height. */
  variant?: "workbench" | "embedded";
  /** When false, only the editor column is shown (no preview column). */
  enablePreview?: boolean;
  /** Preview click jumps to matching source line. */
  enablePreviewSourceNavigation?: boolean;
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
};

function useSelectionMirror(textareaRef: RefObject<HTMLTextAreaElement | null>) {
  const readSelection = useCallback((): TextRange => {
    const el = textareaRef.current;
    if (el == null) {
      return { start: 0, end: 0 };
    }
    return { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
  }, [textareaRef]);

  const writeSelection = useCallback(
    (range: TextRange) => {
      const el = textareaRef.current;
      if (el == null) {
        return;
      }
      el.focus();
      el.setSelectionRange(range.start, range.end);
    },
    [textareaRef],
  );

  return { readSelection, writeSelection };
}

export function CourseMarkdownEditorShell({
  value,
  onChange,
  preview,
  ariaLabel = "Markdown source",
  readOnly = false,
  dirty = false,
  pageDirty = false,
  variant = "workbench",
  enablePreview = true,
  enablePreviewSourceNavigation = true,
  headerSlot,
  footerSlot,
}: CourseMarkdownEditorShellProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const syncingScrollRef = useRef(false);
  const zoomHintHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [zoomHint, setZoomHint] = useState<{ percent: number; token: number } | null>(null);

  const [toolbarPrefs, setToolbarPrefs] = useState<MarkdownToolbarPrefsV1>(() =>
    loadMarkdownToolbarPrefs(),
  );
  const [viewPrefs, setViewPrefs] = useState(() => loadMarkdownEditorViewPrefs());
  const [findOpen, setFindOpen] = useState(false);
  const [findQueryState, setFindQueryState] = useState<
    ({ query: string } & FindQueryOptions) | null
  >(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [admonitionMenuOpen, setAdmonitionMenuOpen] = useState(false);
  const [snippetsMenuOpen, setSnippetsMenuOpen] = useState(false);
  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);
  const [selection, setSelection] = useState<TextRange>({ start: 0, end: 0 });
  const [embeddedHeightPx, setEmbeddedHeightPx] = useState(() =>
    loadMarkdownEditorEmbeddedHeightPx(),
  );

  const history = useMarkdownEditorHistory(value);
  const { readSelection, writeSelection } = useSelectionMirror(textareaRef);

  useEffect(() => {
    const textarea = textareaRef.current;
    const focused = textarea != null && document.activeElement === textarea;
    if (!focused) {
      history.reset(value);
    }
  }, [history, value]);

  const updateViewPrefs = useCallback((patch: Partial<typeof viewPrefs>) => {
    setViewPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveMarkdownEditorViewPrefs(next);
      return next;
    });
  }, []);

  const applyEdit = useCallback(
    (nextText: string, nextSelection: TextRange) => {
      history.push(nextText);
      onChange(nextText);
      setSelection(nextSelection);
      requestAnimationFrame(() => writeSelection(nextSelection));
    },
    [history, onChange, writeSelection],
  );

  const onPreviewSourceLineClick = useCallback(
    (line: number) => {
      const range = scrollEditorToLine(value, line, textareaRef, editorScrollRef);
      setSelection(range);
      if (viewPrefs.viewMode === "preview") {
        updateViewPrefs({ viewMode: "split" });
      }
    },
    [updateViewPrefs, value, viewPrefs.viewMode],
  );

  const previewNavigation = useMemo(
    () =>
      enablePreview && enablePreviewSourceNavigation ? onPreviewSourceLineClick : null,
    [enablePreview, enablePreviewSourceNavigation, onPreviewSourceLineClick],
  );

  const onEditorPaste = useCallback(
    (event: ClipboardEvent<HTMLTextAreaElement>) => {
      if (readOnly) {
        return;
      }

      const imageFile = readClipboardImageFile(event.clipboardData);
      if (imageFile != null) {
        event.preventDefault();
        void (async () => {
          try {
            const resolved = await resolvePastedImageMarkdown(imageFile);
            const markdown = imageMarkdownFromPaste(resolved);
            const target = event.currentTarget;
            const range: TextRange = {
              start: target.selectionStart ?? 0,
              end: target.selectionEnd ?? 0,
            };
            const snippet = `\n${markdown}\n`;
            const result = insertSnippet(value, range, snippet);
            applyEdit(result.text, result.selection);
            if ("dataUrl" in resolved) {
              toast.info("Image embedded as data URL. Save the page to persist inline content.");
            } else {
              toast.success(`Image saved to ${resolved.markdownPath}`);
            }
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to paste image.");
          }
        })();
        return;
      }

      const pasted = event.clipboardData.getData("text/plain");
      if (pasted.length === 0) {
        return;
      }
      const wrapped = wrapPastedLatexForMarkdown(pasted);
      if (wrapped === pasted) {
        return;
      }
      event.preventDefault();
      const target = event.currentTarget;
      const range: TextRange = {
        start: target.selectionStart ?? 0,
        end: target.selectionEnd ?? 0,
      };
      const result = insertSnippet(value, range, wrapped);
      applyEdit(result.text, result.selection);
    },
    [applyEdit, readOnly, value],
  );

  const runToolbarAction = useCallback(
    (
      id: MarkdownToolbarActionId,
      payload?: {
        headingLevel?: 1 | 2 | 3 | 4;
        admonitionVariant?: "Note" | "Tip" | "Warning" | "Danger";
      },
    ) => {
      if (readOnly) {
        return;
      }
      if (id === "image") {
        setImageDialogOpen(true);
        return;
      }
      const currentSelection = readSelection();
      const outcome = applyMarkdownToolbarAction(id, {
        text: value,
        selection: currentSelection,
        headingLevel: payload?.headingLevel,
        admonitionVariant: payload?.admonitionVariant,
      });
      if (outcome.kind === "ui") {
        if (outcome.action === "find") {
          setFindOpen(true);
        }
        if (outcome.action === "link") {
          setLinkDialogOpen(true);
        }
        if (outcome.action === "undo") {
          const prev = history.undo();
          if (prev != null) {
            onChange(prev);
          }
        }
        if (outcome.action === "redo") {
          const next = history.redo();
          if (next != null) {
            onChange(next);
          }
        }
        return;
      }
      applyEdit(outcome.result.text, outcome.result.selection);
    },
    [applyEdit, history, onChange, readOnly, readSelection, value],
  );

  const onInsertSnippet = useCallback(
    (snippet: string, selectionOffset?: { start: number; end: number }) => {
      if (readOnly) {
        return;
      }
      const currentSelection = readSelection();
      const result = insertSnippet(value, currentSelection, snippet, selectionOffset);
      applyEdit(result.text, result.selection);
    },
    [applyEdit, readOnly, readSelection, value],
  );

  const onInsertEmoji = useCallback(
    (emoji: string) => {
      onInsertSnippet(emoji);
    },
    [onInsertSnippet],
  );

  const onEditorScroll = useCallback(() => {
    if (!viewPrefs.syncScroll || !enablePreview) {
      return;
    }
    const editor = editorScrollRef.current;
    const previewEl = previewScrollRef.current;
    if (editor == null || previewEl == null || syncingScrollRef.current) {
      return;
    }
    syncingScrollRef.current = true;
    const editorMax = editor.scrollHeight - editor.clientHeight;
    const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
    const ratio = editorMax > 0 ? editor.scrollTop / editorMax : 0;
    previewEl.scrollTop = ratio * previewMax;
    requestAnimationFrame(() => {
      syncingScrollRef.current = false;
    });
  }, [enablePreview, viewPrefs.syncScroll]);

  const onPreviewScroll = useCallback(() => {
    if (!viewPrefs.syncScroll || !enablePreview) {
      return;
    }
    const editor = editorScrollRef.current;
    const previewEl = previewScrollRef.current;
    if (editor == null || previewEl == null || syncingScrollRef.current) {
      return;
    }
    syncingScrollRef.current = true;
    const editorMax = editor.scrollHeight - editor.clientHeight;
    const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
    const ratio = previewMax > 0 ? previewEl.scrollTop / previewMax : 0;
    editor.scrollTop = ratio * editorMax;
    requestAnimationFrame(() => {
      syncingScrollRef.current = false;
    });
  }, [enablePreview, viewPrefs.syncScroll]);

  const pulseZoomHint = useCallback((percent: number) => {
    setZoomHint({ percent, token: Date.now() });
    if (zoomHintHideRef.current != null) {
      clearTimeout(zoomHintHideRef.current);
    }
    zoomHintHideRef.current = setTimeout(() => {
      setZoomHint(null);
      zoomHintHideRef.current = null;
    }, 1200);
  }, []);

  useEffect(
    () => () => {
      if (zoomHintHideRef.current != null) {
        clearTimeout(zoomHintHideRef.current);
      }
    },
    [],
  );

  const onEditorWheelZoom = useCallback(
    (event: WheelEvent) => {
      if (readOnly || (!event.ctrlKey && !event.metaKey)) {
        return;
      }
      event.preventDefault();
      setViewPrefs((prev) => {
        const nextZoom = nextMarkdownEditorZoom(prev.editorZoom, event.deltaY);
        if (nextZoom === prev.editorZoom) {
          return prev;
        }
        pulseZoomHint(nextZoom);
        const next = { ...prev, editorZoom: nextZoom };
        saveMarkdownEditorViewPrefs(next);
        return next;
      });
    },
    [pulseZoomHint, readOnly],
  );

  const editorSourceStyle = {
    "--course-md-editor-font-size": `${markdownEditorFontSizeRem(viewPrefs.editorZoom)}rem`,
  } as CSSProperties;

  const viewMode: MarkdownEditorViewMode = enablePreview ? viewPrefs.viewMode : "edit";
  const showEditor = viewMode !== "preview";
  const showPreview =
    enablePreview && viewMode !== "edit" && !(viewMode === "split" && viewPrefs.previewHidden);

  useEffect(() => {
    if (!showEditor) {
      return;
    }
    const el = editorScrollRef.current;
    if (el == null) {
      return;
    }
    el.addEventListener("wheel", onEditorWheelZoom, { passive: false });
    return () => el.removeEventListener("wheel", onEditorWheelZoom);
  }, [onEditorWheelZoom, showEditor]);

  const { line, column } = cursorLineColumn(value, selection.start);
  const words = countWords(value);
  const editorCanUndo = history.canUndo();
  const editorCanRedo = history.canRedo();

  const shellClass =
    variant === "workbench"
      ? "course-md-editor-shell course-md-editor-shell--workbench h-full min-h-0"
      : "course-md-editor-shell course-md-editor-shell--embedded";

  const shellStyle =
    variant === "embedded"
      ? ({ height: `${embeddedHeightPx}px` } as CSSProperties)
      : undefined;

  const syntaxHighlightOptions = useMemo(() => {
    if (!findOpen || findQueryState == null || findQueryState.query.length === 0) {
      return undefined;
    }
    return {
      find: buildMarkdownFindHighlight(
        findQueryState.query,
        findQueryState,
        selection.start,
      ),
    };
  }, [findOpen, findQueryState, selection.start]);

  const onOutlineJump = useCallback(
    (line: number) => {
      onPreviewSourceLineClick(line);
    },
    [onPreviewSourceLineClick],
  );

  const showOutline = variant === "workbench" && showEditor && viewPrefs.outlineVisible;

  return (
    <div className={shellClass} style={shellStyle}>
      {headerSlot}
      {!readOnly ? (
        <CourseMarkdownEditorToolbar
          prefs={toolbarPrefs}
          onPrefsChange={setToolbarPrefs}
          onAction={runToolbarAction}
          canUndo={editorCanUndo}
          canRedo={editorCanRedo}
          headingMenuOpen={headingMenuOpen}
          onHeadingMenuOpenChange={setHeadingMenuOpen}
          admonitionMenuOpen={admonitionMenuOpen}
          onAdmonitionMenuOpenChange={setAdmonitionMenuOpen}
          snippetsMenuOpen={snippetsMenuOpen}
          onSnippetsMenuOpenChange={setSnippetsMenuOpen}
          emojiMenuOpen={emojiMenuOpen}
          onEmojiMenuOpenChange={setEmojiMenuOpen}
          onInsertSnippet={onInsertSnippet}
          onInsertEmoji={onInsertEmoji}
        />
      ) : null}
      {findOpen && !readOnly ? (
        <CourseMarkdownEditorFindBar
          text={value}
          selection={selection}
          onApply={applyEdit}
          onClose={() => {
            setFindOpen(false);
            setFindQueryState(null);
          }}
          onQueryStateChange={setFindQueryState}
        />
      ) : null}
      {linkDialogOpen && !readOnly ? (
        <CourseMarkdownLinkInsertDialog
          open={linkDialogOpen}
          text={value}
          selection={selection}
          onApply={applyEdit}
          onClose={() => setLinkDialogOpen(false)}
        />
      ) : null}
      {imageDialogOpen && !readOnly ? (
        <CourseMarkdownImageInsertDialog
          open={imageDialogOpen}
          text={value}
          selection={selection}
          onApply={applyEdit}
          onClose={() => setImageDialogOpen(false)}
        />
      ) : null}
      {enablePreview ? (
        <CourseMarkdownEditorPaneControls
          viewMode={viewMode}
          onViewModeChange={(mode) => updateViewPrefs({ viewMode: mode })}
          syncScroll={viewPrefs.syncScroll}
          onSyncScrollChange={(enabled) => updateViewPrefs({ syncScroll: enabled })}
          previewHidden={viewPrefs.previewHidden}
          onPreviewHiddenChange={(hidden) => updateViewPrefs({ previewHidden: hidden })}
          showOutlineToggle={variant === "workbench"}
          outlineVisible={viewPrefs.outlineVisible}
          onOutlineVisibleChange={(visible) => updateViewPrefs({ outlineVisible: visible })}
        />
      ) : null}
      <div className="course-md-editor-body flex min-h-0 flex-1 flex-row">
        {showOutline ? (
          <CourseMarkdownEditorOutline text={value} activeLine={line} onJumpToLine={onOutlineJump} />
        ) : null}
        <div
          className={`course-md-editor-panes min-h-0 min-w-0 flex-1 ${
            showEditor && showPreview ? "course-md-editor-panes--split" : ""
          }`}
        >
        {showEditor ? (
          <div
            ref={editorScrollRef}
            className="course-md-editor-source relative scrollbar-hide min-h-0 min-w-0 flex-1 overflow-y-auto"
            style={editorSourceStyle}
            onScroll={onEditorScroll}
          >
            {zoomHint != null ? (
              <div
                key={zoomHint.token}
                className="course-md-editor-zoom-hint pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2"
                aria-live="polite"
                aria-atomic
              >
                <span className="course-md-editor-zoom-hint__label">{zoomHint.percent}%</span>
              </div>
            ) : null}
            <div className="course-md-editor-stack min-h-full">
              {!readOnly ? (
                <CourseMarkdownSyntaxBackdrop text={value} highlightOptions={syntaxHighlightOptions} />
              ) : null}
              <textarea
                ref={textareaRef}
                aria-label={ariaLabel}
                readOnly={readOnly}
                spellCheck
                className="course-md-editor-textarea__control course-md-editor-textarea-overlay leading-relaxed"
                value={value}
                onChange={(event) => {
                  const next = event.target.value;
                  history.push(next);
                  onChange(next);
                  setSelection({
                    start: event.target.selectionStart ?? 0,
                    end: event.target.selectionEnd ?? 0,
                  });
                }}
                onSelect={(event) => {
                  const target = event.currentTarget;
                  setSelection({
                    start: target.selectionStart ?? 0,
                    end: target.selectionEnd ?? 0,
                  });
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    if (findOpen) {
                      event.preventDefault();
                      setFindOpen(false);
                      setFindQueryState(null);
                      return;
                    }
                    if (linkDialogOpen) {
                      event.preventDefault();
                      setLinkDialogOpen(false);
                      return;
                    }
                    if (imageDialogOpen) {
                      event.preventDefault();
                      setImageDialogOpen(false);
                      return;
                    }
                  }
                  if (event.key === "Enter" && !event.shiftKey && !readOnly) {
                    const cursor = event.currentTarget.selectionStart ?? 0;
                    const continued = continueMarkdownBlockOnEnter(value, cursor);
                    if (continued != null) {
                      event.preventDefault();
                      applyEdit(continued.text, continued.selection);
                      return;
                    }
                  }
                  if (event.key === "Tab" && !readOnly) {
                    const cursor = event.currentTarget.selectionStart ?? 0;
                    const nextCell = handleMarkdownTableTab(
                      value,
                      cursor,
                      event.shiftKey,
                    );
                    if (nextCell != null) {
                      event.preventDefault();
                      setSelection(nextCell);
                      requestAnimationFrame(() => writeSelection(nextCell));
                      return;
                    }
                  }
                  handleMarkdownEditorKeyDown(event, {
                    onToolbarAction: runToolbarAction,
                    onFindOpen: () => setFindOpen(true),
                    onUndo: () => {
                      const prev = history.undo();
                      if (prev != null) {
                        onChange(prev);
                      }
                    },
                    onRedo: () => {
                      const next = history.redo();
                      if (next != null) {
                        onChange(next);
                      }
                    },
                    canUndo: editorCanUndo,
                    canRedo: editorCanRedo,
                  });
                }}
                onKeyUp={(event) => {
                  const target = event.currentTarget;
                  setSelection({
                    start: target.selectionStart ?? 0,
                    end: target.selectionEnd ?? 0,
                  });
                }}
                onClick={(event) => {
                  const target = event.currentTarget;
                  setSelection({
                    start: target.selectionStart ?? 0,
                    end: target.selectionEnd ?? 0,
                  });
                }}
                onPaste={onEditorPaste}
              />
            </div>
          </div>
        ) : null}
        {showPreview ? (
          <div
            ref={previewScrollRef}
            className="course-md-editor-preview scrollbar-hide min-h-0 min-w-0 flex-1 overflow-y-auto border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-2"
            onScroll={onPreviewScroll}
          >
            <MarkdownEditorPreviewNavigationContext.Provider value={previewNavigation}>
              {preview}
            </MarkdownEditorPreviewNavigationContext.Provider>
          </div>
        ) : null}
        </div>
      </div>
      <div className="course-md-editor-status flex shrink-0 flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-[var(--surface-border)] px-3 py-1 text-[10px] text-[var(--text-muted)]">
        <span>
          Ln {line}, Col {column}
        </span>
        <span>{words} words</span>
        <span>{viewPrefs.editorZoom}%</span>
        <span>{COURSE_MARKDOWN_MATH_STATUS_LABEL}</span>
        {!readOnly ? <span>Ctrl+B/I/K/F</span> : null}
        {!readOnly ? (
          <span>
            {editorCanUndo
              ? "Toolbar undo (Ctrl+Z)"
              : "Typing undo (Ctrl+Z when toolbar stack empty)"}
          </span>
        ) : null}
        {pageDirty ? <span className="text-amber-300/90">Page unsaved</span> : null}
        {dirty ? <span className="text-amber-300/90">File unsaved</span> : null}
        {readOnly ? <span>Read-only</span> : null}
      </div>
      {footerSlot}
      {variant === "embedded" ? (
        <CourseMarkdownEditorEmbeddedResizeHandle
          heightPx={embeddedHeightPx}
          onHeightPxChange={setEmbeddedHeightPx}
        />
      ) : null}
    </div>
  );
}
