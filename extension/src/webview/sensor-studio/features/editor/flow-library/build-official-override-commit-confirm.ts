export function buildOfficialOverrideCommitConfirmMessage(args: {
  presetName: string;
  relPath: string;
  publishOnline: boolean;
}): string {
  const steps = [
    `Update official flow "${args.presetName}"?`,
    "",
    "1. Save the current canvas to overrides/",
    "2. Regenerate bundled presets (flow-preset:gen)",
    "3. Stage to your local ternion-3d-assets-free clone",
    args.publishOnline
      ? "4. Upload to GitHub (GITHUB_TOKEN is set on the Vite dev server)"
      : "4. Skip GitHub upload (set GITHUB_TOKEN on the dev server to publish online)",
    "",
    args.relPath,
  ];
  return steps.join("\n");
}
