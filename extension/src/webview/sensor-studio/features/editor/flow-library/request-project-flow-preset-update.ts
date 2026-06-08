export function shouldConfirmProjectPresetUpdateMismatch(args: {
  linkedProjectPresetId: string | null;
  targetPresetId: string;
}): boolean {
  const { linkedProjectPresetId, targetPresetId } = args;
  return (
    linkedProjectPresetId != null && linkedProjectPresetId !== targetPresetId
  );
}

export function buildProjectPresetUpdateMismatchMessage(args: {
  targetPresetName: string;
  linkedProjectPresetName: string | null;
}): string {
  const linked = args.linkedProjectPresetName?.trim() || "another project preset";
  return (
    `The canvas may still be from "${linked}", not "${args.targetPresetName}".\n\n` +
    `Update will overwrite "${args.targetPresetName}" with the current canvas. Continue anyway?`
  );
}

export function projectFlowPresetUpdateHint(args: {
  presetName: string;
  canvasMatchesLinked: boolean;
  linkedProjectPresetName: string | null;
}): string {
  const base =
    `Overwrite "${args.presetName}" in your project library with the current canvas. ` +
    "Load this preset with Replace, edit, then click Update.";
  if (args.canvasMatchesLinked) {
    return base;
  }
  if (args.linkedProjectPresetName != null) {
    return (
      `${base} Warning: you last loaded "${args.linkedProjectPresetName}"—` +
      "the canvas may not match this row."
    );
  }
  return `${base} Load this preset with Replace first so the canvas matches this row.`;
}

export function buildProjectPresetUpdateConfirmMessage(presetName: string): string {
  return `Update project preset "${presetName}" from the current canvas?\n\nThis overwrites the saved flow in your library.`;
}

export function requestProjectFlowPresetUpdate(args: {
  targetPresetId: string;
  targetPresetName: string;
  linkedProjectPresetId: string | null;
  linkedProjectPresetName: string | null;
  onUpdate: () => void | Promise<void>;
}): void {
  void (async () => {
    if (
      shouldConfirmProjectPresetUpdateMismatch({
        linkedProjectPresetId: args.linkedProjectPresetId,
        targetPresetId: args.targetPresetId,
      })
    ) {
      if (typeof window === "undefined") {
        return;
      }
      const ok = window.confirm(
        buildProjectPresetUpdateMismatchMessage({
          targetPresetName: args.targetPresetName,
          linkedProjectPresetName: args.linkedProjectPresetName,
        }),
      );
      if (!ok) {
        return;
      }
    } else if (typeof window !== "undefined") {
      const ok = window.confirm(buildProjectPresetUpdateConfirmMessage(args.targetPresetName));
      if (!ok) {
        return;
      }
    }
    await args.onUpdate();
  })();
}
