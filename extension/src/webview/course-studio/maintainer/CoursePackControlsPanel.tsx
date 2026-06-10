import { useRef, useState } from "react";

import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInlineToggleRow } from "../../ui/TRN/TRNInlineToggleRow";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import { parsePresentationPackV1 } from "../schemas/presentationPack.v1";
import { resetCourseStudioToBlankPage, bootstrapCourseStudioBlankPage } from "../content/bootstrapCourseStudioContent";
import { clearCourseStudioSessionDraft } from "../content/courseStudioSessionDraft";
import { initCourseScenesForPage } from "../content/initCourseScenesForPage";
import { initCourseDiagramsForPage } from "../content/initCourseDiagramsForPage";
import {
  cloneCoursePage,
  getCoursePageSourcePath,
  isCoursePageReadOnly,
  listCoursePageIds,
  loadCoursePage,
} from "../content/pageRegistry";
import { reloadCourseContentRuntime } from "../content/reloadCourseContentRuntime";
import { importCoursePackDev } from "./importCoursePackDev";
import { reloadCourseContentDev } from "./reloadCourseContentDev";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { useCoursePackStore } from "../content/useCoursePackStore";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";

const PACK_SECTION_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-wide leading-none text-[var(--text-muted)]";

type PackStatus = {
  message: string;
  tone: "success" | "error";
};

export function CoursePackControlsPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<PackStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [overwriteOnImport, setOverwriteOnImport] = useState(false);

  const activePageId = useCoursePackStore((s) => s.activePageId);
  const pageIds = listCoursePageIds();
  const initPage = useCoursePageEditorStore((s) => s.initPage);

  const switchPage = (pageId: string) => {
    const page = loadCoursePage(pageId);
    const sourcePath = getCoursePageSourcePath(pageId);
    if (page == null || sourcePath == null) {
      setStatus({ message: `Page not found: ${pageId}`, tone: "error" });
      return;
    }
    useCoursePackStore.getState().setActivePageId(pageId);
    initPage(cloneCoursePage(page), sourcePath);
    initCourseDiagramsForPage(page);
    initCourseScenesForPage(page);
    setStatus(null);
  };

  const applyImportedPack = (pack: ReturnType<typeof parsePresentationPackV1>, activatePageId: string | null) => {
    const pageId = activatePageId ?? activePageId ?? pageIds[0];
    if (pageId == null) {
      setStatus({ message: "Import succeeded but no page id was returned.", tone: "error" });
      return;
    }
    reloadCourseContentRuntime(pack, pageId);
    useCoursePackStore.getState().setActivePageId(pageId);
    setStatus({ message: `Imported and reloaded page "${pageId}".`, tone: "success" });
  };

  const onLoadDefaultCourse = () => {
    clearCourseStudioSessionDraft();
    useCourseDiagramEditorStore.setState({
      sourcePaths: {},
      baselines: {},
      drafts: {},
      dirty: {},
      selectedNodeIds: {},
      selected3dNodeIds: {},
      historyStacks: {},
    });
    const boot = bootstrapCourseStudioBlankPage();
    initPage(boot.page, boot.sourcePath);
    initCourseDiagramsForPage(boot.page);
    initCourseScenesForPage(boot.page);
    setStatus({ message: "Loaded default BMI270 course page.", tone: "success" });
  };

  const onResetToBlank = () => {
    clearCourseStudioSessionDraft();
    useCourseDiagramEditorStore.setState({
      sourcePaths: {},
      baselines: {},
      drafts: {},
      dirty: {},
      selectedNodeIds: {},
      selected3dNodeIds: {},
      historyStacks: {},
    });
    const boot = resetCourseStudioToBlankPage();
    initPage(boot.page, boot.sourcePath);
    setStatus({ message: "Reset to blank page.", tone: "success" });
  };

  const onImportFile = async (file: File) => {
    setBusy(true);
    setStatus(null);
    try {
      const text = await file.text();
      const pack = parsePresentationPackV1(JSON.parse(text) as unknown);
      const result = await importCoursePackDev(pack, {
        overwrite: overwriteOnImport,
        activatePageId: activePageId ?? undefined,
      });

      if (!result.ok) {
        setStatus({ message: result.error, tone: "error" });
        return;
      }

      applyImportedPack(pack, result.activatePageId ?? result.pageIds[0] ?? null);
      if (result.skipped.length > 0) {
        setStatus({
          message: `Imported page "${result.activatePageId ?? result.pageIds[0] ?? activePageId}". Skipped ${result.skipped.length} existing file(s) — enable Overwrite to replace.`,
          tone: "success",
        });
      }
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : String(error),
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const onReloadFromDisk = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const result = await reloadCourseContentDev(activePageId ?? undefined);
      if (!result.ok) {
        setStatus({ message: result.error, tone: "error" });
        return;
      }
      setStatus({
        message: `Reloaded ${result.pageIds.length} page(s) from content/.`,
        tone: "success",
      });
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : String(error),
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const readOnly = activePageId != null && isCoursePageReadOnly(activePageId);

  return (
    <div className="flex flex-col gap-3">
      <TRNFormField id="course-pack-page" label="Active page">
        <TRNSelect
          value={activePageId ?? pageIds[0] ?? ""}
          ariaLabel="Active Course Studio page"
          options={pageIds.map((pageId) => ({ value: pageId, label: pageId }))}
          onValueChange={switchPage}
        />
      </TRNFormField>

      <div className="flex flex-col gap-2">
        <div className={PACK_SECTION_LABEL_CLASS}>Pack file</div>
        <TRNButton
          className="w-full"
          size="compact"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          hint="Import a .trn-presentation-pack.json file into content/ (dev only)."
        >
          Import pack…
        </TRNButton>
        <TRNInlineToggleRow
          label="Overwrite existing files on import"
          hint="Replace existing content files when importing a pack."
          checked={overwriteOnImport}
          ariaLabel="Overwrite existing content files on pack import"
          onCheckedChange={setOverwriteOnImport}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className={PACK_SECTION_LABEL_CLASS}>Content folder</div>
        <TRNButton
          className="w-full"
          size="compact"
          disabled={busy}
          onClick={() => void onReloadFromDisk()}
          hint="Re-read content/ from disk after CLI import or external edits (dev only)."
        >
          Reload from disk
        </TRNButton>
      </div>

      <div className="flex flex-col gap-2">
        <div className={PACK_SECTION_LABEL_CLASS}>Session</div>
        <TRNButton
          className="w-full"
          size="compact"
          disabled={busy}
          onClick={onLoadDefaultCourse}
          hint="Load the bundled BMI270 Student · Engineering · Programmer course page."
        >
          Load default course
        </TRNButton>
        <div className="flex items-start justify-between gap-2 rounded-md border border-[var(--surface-border)] bg-[var(--surface-card)]/45 px-2.5 py-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold leading-snug text-[var(--text-primary)]">
              Reset to blank page
            </div>
            <div className="mt-0.5 text-[10px] leading-snug text-[var(--text-muted)]">
              Clears session draft and returns to an empty authoring page.
            </div>
          </div>
          <TRNButton
            size="compact"
            className="shrink-0 border-rose-500/40 text-rose-200 hover:bg-rose-500/10"
            disabled={busy}
            onClick={onResetToBlank}
            hint="Discard session edits and return to the empty blank page."
          >
            Reset
          </TRNButton>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file != null) {
            void onImportFile(file);
          }
        }}
      />

      {status != null ? (
        <div
          className={`rounded-md border px-2.5 py-2 text-[10px] leading-snug ${
            status.tone === "error"
              ? "border-amber-500/35 bg-amber-500/10 text-amber-100/90"
              : "border-emerald-500/35 bg-emerald-500/10 text-[var(--text-secondary)]"
          }`}
          role="status"
        >
          {status.message}
        </div>
      ) : null}

      {readOnly ? (
        <TRNHintText>
          Active page is read-only (pack virtual paths). Import to content/ to edit on disk.
        </TRNHintText>
      ) : null}
    </div>
  );
}
