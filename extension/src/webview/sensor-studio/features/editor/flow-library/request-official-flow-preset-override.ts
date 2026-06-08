export function shouldConfirmOfficialOverrideMismatch(args: {
  lastLoadedOfficialPresetId: string | null;
  targetPresetId: string;
}): boolean {
  const { lastLoadedOfficialPresetId, targetPresetId } = args;
  return (
    lastLoadedOfficialPresetId != null && lastLoadedOfficialPresetId !== targetPresetId
  );
}

export function buildOfficialOverrideMismatchMessage(args: {
  targetPresetName: string;
  lastLoadedOfficialPresetName: string | null;
}): string {
  const loaded =
    args.lastLoadedOfficialPresetName?.trim() || "another official flow";
  return (
    `The canvas may still be from "${loaded}", not "${args.targetPresetName}".\n\n` +
    `Override will save the current canvas as "${args.targetPresetName}", regenerate bundled presets, and stage the free pack. Continue anyway?`
  );
}

export function officialFlowPresetOverrideHint(args: {
  presetName: string;
  canvasMatchesLoaded: boolean;
  lastLoadedOfficialPresetName: string | null;
}): string {
  const base =
    `Update official flow "${args.presetName}" from the current canvas. ` +
    "In Vite dev this saves the override, regenerates bundled presets, stages the free pack, " +
    "and uploads to GitHub when GITHUB_TOKEN is set on the dev server. " +
    "Load with Replace, edit, then click Override.";
  if (args.canvasMatchesLoaded) {
    return base;
  }
  if (args.lastLoadedOfficialPresetName != null) {
    return (
      `${base} Warning: you last loaded "${args.lastLoadedOfficialPresetName}"—` +
      "clicking Override here labels the canvas under a different preset name."
    );
  }
  return (
    `${base} Load this preset with Replace first so the canvas matches this row.`
  );
}

export function requestOfficialFlowPresetOverride(args: {
  targetPresetId: string;
  targetPresetName: string;
  lastLoadedOfficialPresetId: string | null;
  lastLoadedOfficialPresetName: string | null;
  onExport: () => void | Promise<void>;
}): void {
  void (async () => {
    if (
      shouldConfirmOfficialOverrideMismatch({
        lastLoadedOfficialPresetId: args.lastLoadedOfficialPresetId,
        targetPresetId: args.targetPresetId,
      })
    ) {
      if (typeof window === "undefined") {
        return;
      }
      const ok = window.confirm(
        buildOfficialOverrideMismatchMessage({
          targetPresetName: args.targetPresetName,
          lastLoadedOfficialPresetName: args.lastLoadedOfficialPresetName,
        }),
      );
      if (!ok) {
        return;
      }
    }
    await args.onExport();
  })();
}
