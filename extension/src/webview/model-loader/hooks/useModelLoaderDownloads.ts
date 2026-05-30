import { useCallback, useEffect, useState } from "react";
import type { ModelLoaderRuntimePort } from "../runtime/loaderRuntimePort";

export function useModelLoaderDownloads(runtime: ModelLoaderRuntimePort) {
  const [outputDir, setOutputDir] = useState(runtime.status.defaultOutputDir);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);

  useEffect(() => {
    setOutputDir(runtime.status.defaultOutputDir);
  }, [runtime.status.defaultOutputDir]);

  const pickFolder = useCallback(async () => {
    const selected = await runtime.pickFolder();
    if (selected) {
      setOutputDir(selected);
      setDownloadNote(null);
      return;
    }
    if (!runtime.status.isExtension) {
      setDownloadNote(
        `Downloads use the folder shown above (from the extension bridge), with one subfolder per product ID.`
      );
    }
  }, [runtime]);

  return {
    outputDir,
    setOutputDir,
    downloadNote,
    setDownloadNote,
    pickFolder,
  };
}
