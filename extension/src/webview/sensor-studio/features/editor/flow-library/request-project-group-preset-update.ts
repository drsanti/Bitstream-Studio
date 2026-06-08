export function projectGroupPresetUpdateHint(args: {
  assetName: string;
  canvasMatchesLinked: boolean;
  linkedProjectAssetName: string | null;
}): string {
  const base =
    `Overwrite "${args.assetName}" in your project library with the current group on the canvas. ` +
    "Select the linked group, edit, then click Update.";
  if (args.canvasMatchesLinked) {
    return base;
  }
  if (args.linkedProjectAssetName != null) {
    return (
      `${base} Warning: you last saved "${args.linkedProjectAssetName}"—` +
      "the canvas group may not match this row."
    );
  }
  return `${base} Save the group to library first so the canvas matches this row.`;
}

export function buildProjectGroupPresetUpdateConfirmMessage(assetName: string): string {
  return `Update project group preset "${assetName}" from the canvas group?\n\nThis overwrites the saved preset in your library.`;
}

export function requestProjectGroupPresetUpdate(args: {
  targetAssetId: string;
  targetAssetName: string;
  onUpdate: () => void | Promise<void>;
}): void {
  void (async () => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        buildProjectGroupPresetUpdateConfirmMessage(args.targetAssetName),
      );
      if (!ok) {
        return;
      }
    }
    await args.onUpdate();
  })();
}
