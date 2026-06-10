import { ClipboardCopy, Download, MoreVertical, Save, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
} from "../../ui/TRN/TRNMenu";
import { getCourseSceneSourcePath } from "../content/sceneRegistry";
import type { SceneV1 } from "../schemas/scene.v1";
import {
  copySceneV1ToClipboard,
  downloadSceneV1Json,
  readSceneV1FromFileInput,
} from "./courseSceneDocumentIo";
import { CourseMarkdownEditorIconButton } from "./markdown-editor/CourseMarkdownEditorIconButton";
import { saveCourseScene } from "./saveCourseScene";
import { useCourseSceneEditorStore } from "./useCourseSceneEditorStore";

const MENU_ITEM_CLASS = "!px-2.5 !py-1.5 !text-[11px]";

export function CourseSceneDocumentMenu({
  documentId,
  scene,
}: {
  documentId: string;
  scene: SceneV1;
}) {
  const dirty = useCourseSceneEditorStore((s) => s.dirty[documentId] === true);
  const canUndo = useCourseSceneEditorStore((s) => s.canUndoScene(documentId));
  const canRedo = useCourseSceneEditorStore((s) => s.canRedoScene(documentId));
  const undoScene = useCourseSceneEditorStore((s) => s.undoScene);
  const redoScene = useCourseSceneEditorStore((s) => s.redoScene);
  const discardScene = useCourseSceneEditorStore((s) => s.discardScene);
  const markSceneClean = useCourseSceneEditorStore((s) => s.markSceneClean);
  const replaceSceneDraft = useCourseSceneEditorStore((s) => s.replaceSceneDraft);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const sourcePath = getCourseSceneSourcePath(documentId) ?? "";

  const close = () => setOpen(false);

  const handleSave = async () => {
    if (!dirty || sourcePath.length === 0) {
      return;
    }
    setSaving(true);
    try {
      const result = await saveCourseScene(sourcePath, scene);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      markSceneClean(documentId, scene);
      toast.success("Scene saved");
      close();
    } finally {
      setSaving(false);
    }
  };

  const handleExportClipboard = async () => {
    try {
      await copySceneV1ToClipboard(scene);
      toast.success("Scene JSON copied to clipboard");
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Clipboard export failed");
    }
  };

  const handleExportDownload = () => {
    downloadSceneV1Json(scene, `${documentId}.scene.v1.json`);
    toast.success("Scene JSON download started");
    close();
  };

  const handleImportFile = async (file: File) => {
    try {
      const imported = await readSceneV1FromFileInput(file);
      replaceSceneDraft(documentId, imported);
      toast.success("Scene imported into editor draft");
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid scene JSON");
    }
  };

  return (
    <div className="relative shrink-0">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file != null) {
            void handleImportFile(file);
          }
          event.target.value = "";
        }}
      />
      <CourseMarkdownEditorIconButton
        hint={dirty ? "Scene menu · unsaved changes" : "Scene menu"}
        ariaLabel="Scene menu"
        selected={open}
        onClick={() => setOpen((value) => !value)}
        className="relative"
      >
        <MoreVertical size={14} strokeWidth={2} aria-hidden />
        {dirty ? (
          <span
            className="pointer-events-none absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-amber-400"
            aria-hidden
          />
        ) : null}
      </CourseMarkdownEditorIconButton>
      {open ? (
        <>
          <div className="fixed inset-0 z-[1090]" onPointerDown={close} />
          <div className="absolute right-0 top-full z-[1100] mt-1 w-[13.5rem]">
            <TRNMenuPanel tone="glass-dropdown" className="p-1 scrollbar-hide">
              <TRNMenuSectionTitle spacing="menuFirst">Scene</TRNMenuSectionTitle>
              <TRNMenuItemButton
                label="Undo"
                disabled={!canUndo}
                rightSlot={<span className="text-[10px] text-zinc-500">Ctrl+Z</span>}
                className={MENU_ITEM_CLASS}
                onClick={() => {
                  undoScene(documentId);
                  close();
                }}
              />
              <TRNMenuItemButton
                label="Redo"
                disabled={!canRedo}
                rightSlot={
                  <span className="text-[10px] text-zinc-500">Ctrl+Shift+Z</span>
                }
                className={MENU_ITEM_CLASS}
                onClick={() => {
                  redoScene(documentId);
                  close();
                }}
              />
              <TRNMenuSectionTitle spacing="menuNext">Export / import</TRNMenuSectionTitle>
              <TRNMenuItemButton
                label="Copy JSON"
                icon={<ClipboardCopy size={12} strokeWidth={2} aria-hidden />}
                className={MENU_ITEM_CLASS}
                onClick={() => void handleExportClipboard()}
              />
              <TRNMenuItemButton
                label="Download JSON"
                icon={<Download size={12} strokeWidth={2} aria-hidden />}
                className={MENU_ITEM_CLASS}
                onClick={handleExportDownload}
              />
              <TRNMenuItemButton
                label="Import JSON file"
                icon={<Upload size={12} strokeWidth={2} aria-hidden />}
                className={MENU_ITEM_CLASS}
                onClick={() => importInputRef.current?.click()}
              />
              {dirty ? (
                <>
                  <TRNMenuSectionTitle spacing="menuNext">Document</TRNMenuSectionTitle>
                  <TRNMenuItemButton
                    label="Discard changes"
                    className={MENU_ITEM_CLASS}
                    onClick={() => {
                      discardScene(documentId);
                      close();
                    }}
                  />
                  <TRNMenuItemButton
                    label={saving ? "Saving…" : "Save scene"}
                    disabled={saving || sourcePath.length === 0}
                    icon={<Save size={12} strokeWidth={2} aria-hidden />}
                    className={MENU_ITEM_CLASS}
                    onClick={() => void handleSave()}
                  />
                </>
              ) : null}
            </TRNMenuPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}
