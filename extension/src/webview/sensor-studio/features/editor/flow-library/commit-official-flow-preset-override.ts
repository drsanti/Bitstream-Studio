import type { StudioDemoTemplateId } from "../store/flow-editor.store";
import { buildOfficialOverrideCommitConfirmMessage } from "./build-official-override-commit-confirm";
import { officialFlowPresetFileName } from "./demo-template-flow-preset-category";
import {
  commitOfficialFlowPresetOverrideFullDev,
  fetchFlowPresetPublishStatusDev,
  isFlowPresetOverrideDevApiAvailable,
} from "./apply-official-flow-preset-override-dev";
import { buildOfficialFlowPresetOverride } from "./export-official-flow-preset-override";
import type { OfficialFlowPresetOverrideGraph } from "./export-official-flow-preset-override";
import {
  downloadStudioFlowPresetFile,
  type StudioFlowPresetFile,
} from "./studio-flow-preset-file";

export type CommitOfficialFlowPresetOverridePipeline = {
  regen: true;
  staged: {
    stagedPackPath: string;
    fileCount: number;
    nextStep?: string;
  };
  published?: {
    fileCount: number;
    repo: string;
    branch: string;
    remotePrefix: string;
  };
};

export type CommitOfficialFlowPresetOverrideResult =
  | {
      mode: "repo";
      path: string;
      warning?: string;
      pipeline: CommitOfficialFlowPresetOverridePipeline;
    }
  | { mode: "download"; fileName: string }
  | { mode: "cancelled" }
  | { mode: "error"; error: string; step?: string };

export async function commitOfficialFlowPresetOverride(args: {
  templateId: StudioDemoTemplateId;
  presetName: string;
  graph: OfficialFlowPresetOverrideGraph;
  preset?: StudioFlowPresetFile;
}): Promise<CommitOfficialFlowPresetOverrideResult> {
  const preset =
    args.preset ??
    buildOfficialFlowPresetOverride(args.templateId, args.graph, {
      name: args.presetName,
    });
  const fileName = officialFlowPresetFileName(args.templateId);
  const relPath = `src/assets/libraries/flow-preset/overrides/${fileName}`;

  if (isFlowPresetOverrideDevApiAvailable()) {
    const publishStatus = await fetchFlowPresetPublishStatusDev();
    const publishOnline =
      publishStatus.ok === true && publishStatus.githubTokenConfigured === true;

    if (typeof window !== "undefined") {
      const ok = window.confirm(
        buildOfficialOverrideCommitConfirmMessage({
          presetName: args.presetName,
          relPath,
          publishOnline,
        }),
      );
      if (!ok) {
        return { mode: "cancelled" };
      }
    }

    const result = await commitOfficialFlowPresetOverrideFullDev({
      templateId: args.templateId,
      preset,
      publishOnline,
    });
    if (result.ok) {
      return {
        mode: "repo",
        path: result.path,
        warning: result.warning,
        pipeline: {
          regen: true,
          staged: result.staged,
          published: result.published,
        },
      };
    }
    return { mode: "error", error: result.error, step: result.step };
  }

  downloadStudioFlowPresetFile(preset, fileName);
  return { mode: "download", fileName };
}
