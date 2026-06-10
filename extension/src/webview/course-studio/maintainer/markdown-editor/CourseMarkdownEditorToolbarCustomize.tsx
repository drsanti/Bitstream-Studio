import { ChevronDown, ChevronUp, RotateCcw, Settings2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNInlineToggleRow } from "../../../ui/TRN/TRNInlineToggleRow";
import { TRNMenuPanel } from "../../../ui/TRN/TRNMenu";
import { CourseMarkdownEditorIconButton } from "./CourseMarkdownEditorIconButton";
import {
  MARKDOWN_TOOLBAR_ACTION_META,
  type MarkdownToolbarActionId,
} from "./markdownEditorActions";
import {
  defaultMarkdownToolbarPrefs,
  loadMarkdownToolbarPrefs,
  moveToolbarAction,
  saveMarkdownToolbarPrefs,
  setToolbarActionVisible,
  type MarkdownToolbarPrefsV1,
} from "./markdownEditorToolbarPersistence";

export function CourseMarkdownEditorToolbarCustomize({
  onPrefsChange,
}: {
  onPrefsChange: (prefs: MarkdownToolbarPrefsV1) => void;
}) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<MarkdownToolbarPrefsV1>(() => loadMarkdownToolbarPrefs());
  const anchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (open) {
      setPrefs(loadMarkdownToolbarPrefs());
    }
  }, [open]);

  const commit = useCallback(
    (next: MarkdownToolbarPrefsV1) => {
      setPrefs(next);
      saveMarkdownToolbarPrefs(next);
      onPrefsChange(next);
    },
    [onPrefsChange],
  );

  return (
    <>
      <span ref={anchorRef} className="inline-flex">
        <CourseMarkdownEditorIconButton
          hint="Customize toolbar — show, hide, and reorder tools."
          ariaLabel="Customize toolbar"
          selected={open}
          onClick={() => setOpen((value) => !value)}
        >
          <Settings2 size={14} strokeWidth={2} aria-hidden />
        </CourseMarkdownEditorIconButton>
      </span>
      {open ? (
        <div className="fixed inset-0 z-[1100]" onPointerDown={() => setOpen(false)}>
          <div
            className="absolute"
            style={{
              top: (anchorRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
              left: Math.max(8, (anchorRef.current?.getBoundingClientRect().left ?? 0) - 180),
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <TRNMenuPanel tone="glass-dropdown" className="w-72 p-2 scrollbar-hide">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <p className="text-[11px] font-semibold text-[var(--text-primary)]">
                  Toolbar tools
                </p>
                <TRNButton
                  size="compact"
                  className="min-w-0 px-2"
                  hint="Restore default toolbar order and visibility."
                  onClick={() => commit(defaultMarkdownToolbarPrefs())}
                >
                  <RotateCcw size={12} aria-hidden />
                </TRNButton>
              </div>
              <ToolbarCustomizeList prefs={prefs} onChange={commit} />
            </TRNMenuPanel>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ToolbarCustomizeList({
  prefs,
  onChange,
}: {
  prefs: MarkdownToolbarPrefsV1;
  onChange: (prefs: MarkdownToolbarPrefsV1) => void;
}) {
  return (
    <ul className="max-h-64 space-y-1 overflow-y-auto scrollbar-hide">
      {prefs.order.map((id) => {
        const meta = MARKDOWN_TOOLBAR_ACTION_META[id];
        const visible = !prefs.hidden.includes(id);
        return (
          <li key={id}>
            <TRNInlineToggleRow
              label={meta.label}
              checked={visible}
              ariaLabel={`Show ${meta.label}`}
              onCheckedChange={(checked) =>
                onChange(setToolbarActionVisible(prefs, id, checked))
              }
              middleSlot={
                <div className="flex shrink-0 gap-0.5">
                  <TRNButton
                    size="compact"
                    className="min-w-7 px-1"
                    hint={`Move ${meta.label} up`}
                    aria-label={`Move ${meta.label} up`}
                    onClick={() => onChange(moveToolbarAction(prefs, id, -1))}
                  >
                    <ChevronUp size={12} aria-hidden />
                  </TRNButton>
                  <TRNButton
                    size="compact"
                    className="min-w-7 px-1"
                    hint={`Move ${meta.label} down`}
                    aria-label={`Move ${meta.label} down`}
                    onClick={() => onChange(moveToolbarAction(prefs, id, 1))}
                  >
                    <ChevronDown size={12} aria-hidden />
                  </TRNButton>
                </div>
              }
            />
          </li>
        );
      })}
    </ul>
  );
}

export type { MarkdownToolbarPrefsV1 };
