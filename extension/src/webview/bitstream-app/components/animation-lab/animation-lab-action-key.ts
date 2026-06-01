/** Resolve a clip name to a key in the animation action map (exact, then case-insensitive). */
export function resolveAnimationLabActionKey(
  actionKeys: ReadonlySet<string> | Iterable<string>,
  preferredName: string | null | undefined,
): string | null {
  const keys = actionKeys instanceof Set ? actionKeys : new Set(actionKeys);
  if (keys.size === 0) {
    return null;
  }
  if (preferredName != null && preferredName.length > 0) {
    if (keys.has(preferredName)) {
      return preferredName;
    }
    const lower = preferredName.toLowerCase();
    for (const key of keys) {
      if (key.toLowerCase() === lower) {
        return key;
      }
    }
  }
  return keys.values().next().value ?? null;
}
