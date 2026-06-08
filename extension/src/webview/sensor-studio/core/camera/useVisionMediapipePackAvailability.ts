import { useEffect, useMemo, useState } from "react";
import { isPreferBundledMediapipeEnabled } from "./vision-mediapipe-endpoints";
import { probeVisionMediapipePackFiles } from "./vision-mediapipe-pack-availability";

export type VisionMediapipePackAvailability = {
  checking: boolean;
  missing: string[];
  /** True when Prefer bundled is on and at least one required optional file is missing. */
  showMissingChip: boolean;
};

export function useVisionMediapipePackAvailability(
  requiredFiles: readonly string[],
): VisionMediapipePackAvailability {
  const filesKey = useMemo(() => requiredFiles.join("\0"), [requiredFiles]);
  const [checking, setChecking] = useState(true);
  const [missing, setMissing] = useState<string[]>([]);
  const preferBundled = isPreferBundledMediapipeEnabled();

  useEffect(() => {
    if (!preferBundled || requiredFiles.length === 0) {
      setChecking(false);
      setMissing([]);
      return;
    }

    const ac = new AbortController();
    setChecking(true);
    void probeVisionMediapipePackFiles(requiredFiles, ac.signal).then((result) => {
      if (ac.signal.aborted) {
        return;
      }
      setMissing(result.missing);
      setChecking(false);
    });

    return () => ac.abort();
  }, [preferBundled, filesKey, requiredFiles]);

  return {
    checking,
    missing,
    showMissingChip: preferBundled && requiredFiles.length > 0 && !checking && missing.length > 0,
  };
}
