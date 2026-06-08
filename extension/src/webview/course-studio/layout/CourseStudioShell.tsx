import { useCallback, useState } from "react";
import { Moon, Sun, GraduationCap, Pencil, Save, Undo2 } from "lucide-react";
import { toast } from "react-toastify";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";
import { TRN_HINT_HOVER_DELAY_MS } from "../../ui/TRN/TRNHintText";
import { TRNToggleSwitch } from "../../ui/TRN/TRNToggleSwitch";
import { PresentationThemeProvider } from "../../presentation/design/PresentationThemeProvider";
import { usePresentationThemeStore } from "../../presentation/store/usePresentationThemeStore";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store";
import { useWsClientStore } from "../../ws-client-store";
import { CoursePageRenderer } from "../runtime/CoursePageRenderer";
import { CourseDocumentStatusBadge } from "../runtime/CourseDocumentStatusBadge";
import {
  isCourseStudioMaintainerModeAvailable,
  useCourseStudioMaintainerModeEnabled,
  useCourseStudioMaintainerModeStore,
} from "../maintainer/courseStudioMaintainerMode";
import { CourseMaintainerSidePanel } from "../maintainer/CourseMaintainerSidePanel";
import { saveCoursePageDev } from "../maintainer/saveCoursePageDev";
import { useCoursePageEditorStore } from "../maintainer/useCoursePageEditorStore";
import { useCourseMaintainerKeyboardShortcuts } from "../maintainer/useCourseMaintainerKeyboardShortcuts";
import { CourseMotionController } from "../motion/CourseMotionController";
import { Bmi270FrameRefSync } from "../../presentation/app/Bmi270FrameRefSync";
import "../course-studio.css";

export function CourseStudioShell() {
  const theme = usePresentationThemeStore((s) => s.theme);
  const toggleTheme = usePresentationThemeStore((s) => s.toggle);
  const connected = useBitstreamConnectionStore((s) => s.connected);
  const wsConnected = useWsClientStore((s) => s.isConnected);
  const live = connected && wsConnected;

  const maintainerAvailable = isCourseStudioMaintainerModeAvailable();
  const maintainerEnabled = useCourseStudioMaintainerModeEnabled();
  const setMaintainerEnabled = useCourseStudioMaintainerModeStore((s) => s.setEnabled);
  useCourseMaintainerKeyboardShortcuts(maintainerEnabled);

  const page = useCoursePageEditorStore((s) => s.page);
  const dirty = useCoursePageEditorStore((s) => s.dirty);
  const sourcePath = useCoursePageEditorStore((s) => s.sourcePath);
  const discardChanges = useCoursePageEditorStore((s) => s.discardChanges);
  const markClean = useCoursePageEditorStore((s) => s.markClean);
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);

  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (page == null || !dirty) {
      return;
    }
    setSaving(true);
    try {
      const result = await saveCoursePageDev(sourcePath, page);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      markClean(page);
      toast.success("Page saved to repo");
    } finally {
      setSaving(false);
    }
  }, [dirty, markClean, page, sourcePath]);

  if (page == null) {
    return null;
  }

  return (
    <PresentationThemeProvider rootClassName="presentation-root course-studio-root">
      <Bmi270FrameRefSync />
      <CourseMotionController>
        <header className="course-studio-topbar flex h-11 shrink-0 items-center justify-between border-b px-4">
          <div className="flex min-w-0 items-center gap-2">
            <GraduationCap size={16} strokeWidth={2} style={{ color: "var(--accent-amber)" }} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                Course Studio
              </div>
              <div className="truncate text-2xs text-[var(--text-muted)]">
                {page.title}
                {maintainerEnabled ? " · Maintainer" : ""}
                {dirty ? " · Unsaved" : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {maintainerAvailable ? (
              <label className="flex items-center gap-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-2.5 py-1">
                <Pencil size={13} strokeWidth={2} className="text-[var(--text-muted)]" />
                <span className="text-2xs font-medium text-[var(--text-secondary)]">Maintainer</span>
                <TRNToggleSwitch
                  checked={maintainerEnabled}
                  onCheckedChange={setMaintainerEnabled}
                  ariaLabel="Toggle maintainer mode"
                />
              </label>
            ) : null}
            {maintainerEnabled && dirty ? (
              <>
                <TRNTooltip
                  content="Discard unsaved edits"
                  openDelayMs={TRN_HINT_HOVER_DELAY_MS}
                  disableHoverFx
                  triggerWrapper="span"
                  triggerClassName="inline-flex"
                  trigger={
                    <button
                      type="button"
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-2.5 text-2xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                      onClick={discardChanges}
                    >
                      <Undo2 size={14} strokeWidth={2} />
                      Discard
                    </button>
                  }
                />
                <TRNTooltip
                  content="Save page JSON to repo (dev only)"
                  openDelayMs={TRN_HINT_HOVER_DELAY_MS}
                  disableHoverFx
                  triggerWrapper="span"
                  triggerClassName="inline-flex"
                  trigger={
                    <button
                      type="button"
                      disabled={saving}
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 text-2xs font-semibold text-amber-100 hover:bg-amber-500/25 disabled:opacity-60"
                      onClick={() => void handleSave()}
                    >
                      <Save size={14} strokeWidth={2} />
                      {saving ? "Saving…" : "Save"}
                    </button>
                  }
                />
              </>
            ) : null}
            <CourseDocumentStatusBadge meta={page.meta} />
            <span
              className="rounded-full border px-2.5 py-1 text-2xs font-semibold"
              style={{
                color: live ? "var(--status-live)" : "var(--text-muted)",
                borderColor: live
                  ? "color-mix(in srgb, var(--status-live) 35%, transparent)"
                  : "var(--surface-border)",
              }}
            >
              {live ? "Live store" : "No link"}
            </span>
            <TRNTooltip
              content={theme === "dark" ? "Light theme" : "Dark theme"}
              openDelayMs={TRN_HINT_HOVER_DELAY_MS}
              disableHoverFx
              triggerWrapper="span"
              triggerClassName="inline-flex"
              trigger={
                <button
                  type="button"
                  aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
                </button>
              }
            />
          </div>
        </header>
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <main
            className="min-h-0 min-w-0 flex-1 overflow-y-auto scrollbar-hide py-6"
            onClick={maintainerEnabled ? () => selectBlock(null) : undefined}
          >
            <CoursePageRenderer page={page} />
          </main>
          {maintainerEnabled ? (
            <div className="course-maintainer-side-panel-host relative h-full min-h-0 shrink-0">
              <CourseMaintainerSidePanel />
            </div>
          ) : null}
        </div>
      </CourseMotionController>
    </PresentationThemeProvider>
  );
}
