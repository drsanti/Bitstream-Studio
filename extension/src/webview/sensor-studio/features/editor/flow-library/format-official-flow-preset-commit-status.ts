import type { CommitOfficialFlowPresetOverridePipeline } from "./commit-official-flow-preset-override";

export function formatOfficialFlowPresetCommitStatus(args: {
  path: string;
  warning?: string;
  pipeline?: CommitOfficialFlowPresetOverridePipeline;
}): string {
  const parts = [`Override saved → ${args.path}`];
  if (args.warning) {
    parts[0] += ` (${args.warning})`;
  }
  if (args.pipeline == null) {
    return parts[0];
  }
  parts.push("Bundled presets regenerated.");
  if (args.pipeline.staged != null) {
    parts.push(
      `Staged ${args.pipeline.staged.fileCount} files → ${args.pipeline.staged.stagedPackPath}.`,
    );
  }
  if (args.pipeline.published != null) {
    parts.push(
      `Published ${args.pipeline.published.fileCount} files to ${args.pipeline.published.repo}@${args.pipeline.published.branch}.`,
    );
  } else if (args.pipeline.staged?.nextStep != null) {
    parts.push(args.pipeline.staged.nextStep);
  }
  return parts.join(" ");
}
