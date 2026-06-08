import { FolderInput } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TRNButton, TRNHintText, TRNInlineToggleRow } from "../../../../../ui/TRN";
import { CANVAS_DEMO_TEMPLATE_OPTIONS } from "../inspector/canvas-inspector-demo-templates";
import {
  applyOfficialFlowPresetOverrideFileToRepoDev,
  fetchFlowPresetPublishStatusDev,
  finalizeOfficialFlowPresetOverridesDev,
  isFlowPresetOverrideDevApiAvailable,
  type FlowPresetPublishStatus,
} from "../../flow-library/apply-official-flow-preset-override-dev";
import { commitOfficialFlowPresetOverride } from "../../flow-library/commit-official-flow-preset-override";
import { officialFlowPresetIdForTemplate } from "../../flow-library/demo-template-flow-preset-category";
import { formatOfficialFlowPresetCommitStatus } from "../../flow-library/format-official-flow-preset-commit-status";
import {
  isFlowPresetMaintainerModeAvailable,
  useFlowPresetMaintainerModeStore,
} from "../../flow-library/flow-preset-maintainer-mode";
import { useFlowPresetMaintainerSessionStore } from "../../flow-library/flow-preset-maintainer-session";
import {
  officialFlowPresetOverrideHint,
  requestOfficialFlowPresetOverride,
} from "../../flow-library/request-official-flow-preset-override";
import type { StudioDemoTemplateId } from "../../store/flow-editor.store";
import { useFlowEditorStore } from "../../store/flow-editor.store";

type FlowPresetMaintainerToolsProps = {
  dense?: boolean;
  /** When set, show export for this starter template (Document tab). */
  templateId?: StudioDemoTemplateId;
};

export function FlowPresetMaintainerTools(props: FlowPresetMaintainerToolsProps) {
  const { dense = false, templateId } = props;
  const enabled = useFlowPresetMaintainerModeStore((s) => s.enabled);
  const setEnabled = useFlowPresetMaintainerModeStore((s) => s.setEnabled);
  const importInputRef = useRef<HTMLInputElement>(null);

  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const subgraphs = useFlowEditorStore((s) => s.subgraphs);
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);
  const rootNodes = useFlowEditorStore((s) => s.rootNodes);
  const rootEdges = useFlowEditorStore((s) => s.rootEdges);
  const lastLoadedOfficialPresetId = useFlowPresetMaintainerSessionStore(
    (s) => s.lastLoadedOfficialPresetId,
  );
  const lastLoadedOfficialPresetName = useFlowPresetMaintainerSessionStore(
    (s) => s.lastLoadedOfficialPresetName,
  );
  const lastCommitStatus = useFlowPresetMaintainerSessionStore((s) => s.lastCommitStatus);
  const setLastCommitStatus = useFlowPresetMaintainerSessionStore((s) => s.setLastCommitStatus);

  const devApi = isFlowPresetOverrideDevApiAvailable();
  const [publishStatus, setPublishStatus] = useState<FlowPresetPublishStatus | null>(null);

  useEffect(() => {
    if (!enabled || !devApi) {
      setPublishStatus(null);
      return;
    }
    void fetchFlowPresetPublishStatusDev().then((result) => {
      if (result.ok) {
        setPublishStatus(result);
      }
    });
  }, [devApi, enabled]);

  const commitCanvasOverride = useCallback(
    async (targetTemplateId: StudioDemoTemplateId) => {
      const option = CANVAS_DEMO_TEMPLATE_OPTIONS.find(
        (entry) => entry.value === targetTemplateId,
      );
      const presetName = option?.label ?? targetTemplateId;
      const presetId = officialFlowPresetIdForTemplate(targetTemplateId);
      requestOfficialFlowPresetOverride({
        targetPresetId: presetId,
        targetPresetName: presetName,
        lastLoadedOfficialPresetId,
        lastLoadedOfficialPresetName,
        onExport: async () => {
          const result = await commitOfficialFlowPresetOverride({
            templateId: targetTemplateId,
            presetName,
            graph: {
              nodes,
              edges,
              subgraphs,
              activeGraphId,
              rootNodes,
              rootEdges,
            },
          });
          if (result.mode === "repo") {
            setLastCommitStatus(
              formatOfficialFlowPresetCommitStatus({
                path: result.path,
                warning: result.warning,
                pipeline: result.pipeline,
              }),
            );
          } else if (result.mode === "download") {
            setLastCommitStatus(`Downloaded ${result.fileName}`);
          } else if (result.mode === "error") {
            setLastCommitStatus(
              `Override failed${result.step != null ? ` at ${result.step}` : ""}: ${result.error}`,
            );
          } else {
            setLastCommitStatus(null);
          }
        },
      });
    },
    [
      activeGraphId,
      edges,
      lastLoadedOfficialPresetId,
      lastLoadedOfficialPresetName,
      nodes,
      rootEdges,
      rootNodes,
      setLastCommitStatus,
      subgraphs,
    ],
  );

  const onImportOverrideFile = useCallback(
    async (file: File) => {
      if (!devApi) {
        setLastCommitStatus("Import to repo is only available in Vite dev.");
        return;
      }
      setLastCommitStatus("Importing override file…");
      const importResult = await applyOfficialFlowPresetOverrideFileToRepoDev(file);
      if (!importResult.ok) {
        setLastCommitStatus(`Import failed: ${importResult.error}`);
        return;
      }

      const publishOnline = publishStatus?.githubTokenConfigured === true;
      setLastCommitStatus("Regenerating bundled presets and staging free pack…");
      const finalizeResult = await finalizeOfficialFlowPresetOverridesDev({ publishOnline });
      if (!finalizeResult.ok) {
        setLastCommitStatus(
          `Finalize failed${finalizeResult.step != null ? ` at ${finalizeResult.step}` : ""}: ${finalizeResult.error}`,
        );
        return;
      }

      setLastCommitStatus(
        formatOfficialFlowPresetCommitStatus({
          path: importResult.path,
          warning: importResult.warning,
          pipeline: {
            regen: true,
            staged: finalizeResult.staged,
            published: finalizeResult.published,
          },
        }),
      );
    },
    [devApi, publishStatus?.githubTokenConfigured, setLastCommitStatus],
  );

  if (!isFlowPresetMaintainerModeAvailable()) {
    return null;
  }

  return (
    <div
      className={`rounded border border-amber-900/45 bg-amber-950/15 ${
        dense ? "space-y-1.5 px-2 py-1.5" : "space-y-2 px-2.5 py-2"
      }`}
    >
      <TRNInlineToggleRow
        checked={enabled}
        onCheckedChange={setEnabled}
        label="Maintainer mode"
        hint="Dev-only: one-click Override on each Official row updates bundled presets and stages the free pack."
      />
      {enabled ? (
        <>
          <TRNHintText tone="muted" className={dense ? "text-[10px]" : "text-[11px]"}>
            Load Official → Replace, edit the canvas, then click the{" "}
            <span className="text-zinc-300">Override</span> icon on that row. One click saves
            the override, regenerates bundled presets, stages the free pack, and uploads to
            GitHub when <span className="text-zinc-300">GITHUB_TOKEN</span> is set on the Vite
            dev server.
          </TRNHintText>
          {devApi ? (
            <div className="flex flex-wrap gap-1.5">
              <TRNButton
                type="button"
                size="compact"
                prefixIcon={<FolderInput className="h-3.5 w-3.5" aria-hidden />}
                hint="Import a trn-flow-preset JSON into overrides/, then regenerate bundled presets and stage the free pack (no canvas export)."
                onClick={() => importInputRef.current?.click()}
              >
                Import override file…
              </TRNButton>
              <input
                ref={importInputRef}
                type="file"
                accept=".json,.trn-flow-preset.json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file != null) {
                    void onImportOverrideFile(file);
                  }
                  e.target.value = "";
                }}
              />
            </div>
          ) : null}
          {templateId != null ? (
            <TRNButton
              type="button"
              size="compact"
              className="w-full"
              hint={officialFlowPresetOverrideHint({
                presetName:
                  CANVAS_DEMO_TEMPLATE_OPTIONS.find((entry) => entry.value === templateId)
                    ?.label ?? templateId,
                canvasMatchesLoaded:
                  lastLoadedOfficialPresetId ===
                  officialFlowPresetIdForTemplate(templateId),
                lastLoadedOfficialPresetName,
              })}
              onClick={() => void commitCanvasOverride(templateId)}
            >
              Save canvas override
            </TRNButton>
          ) : null}
          {publishStatus != null ? (
            <TRNHintText tone="muted" className={dense ? "text-[10px]" : "text-[11px]"}>
              Free pack clone:{" "}
              <span className="text-zinc-300">
                {publishStatus.freeRepoExists ? publishStatus.freeRepoPath : "not found"}
              </span>
              {publishStatus.githubTokenConfigured
                ? " · GitHub upload on Override"
                : " · GitHub upload needs GITHUB_TOKEN on dev server"}
            </TRNHintText>
          ) : null}
          {lastCommitStatus != null ? (
            <TRNHintText tone="muted" className={dense ? "text-[10px]" : "text-[11px]"}>
              {lastCommitStatus}
            </TRNHintText>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
