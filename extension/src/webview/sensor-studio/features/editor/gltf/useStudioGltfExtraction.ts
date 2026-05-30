import { useEffect, useState } from "react";
import {
  countStudioGltfExtractionRows,
  extractStudioGltfComponents,
  type StudioGltfExtractionResult,
} from "./studio-gltf-extract";

type LoadState = "idle" | "loading" | "ok" | "error";

export function useStudioGltfExtraction(fetchUrl: string | null): {
  state: LoadState;
  result: StudioGltfExtractionResult | null;
  errorMessage: string | null;
  totalRows: number;
} {
  const [state, setState] = useState<LoadState>("idle");
  const [result, setResult] = useState<StudioGltfExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (fetchUrl == null || fetchUrl.trim().length === 0) {
      setState("idle");
      setResult(null);
      setErrorMessage(null);
      return;
    }

    let cancelled = false;
    const url = fetchUrl.trim();

    setState("loading");
    setErrorMessage(null);
    setResult(null);

    void (async () => {
      try {
        const next = await extractStudioGltfComponents(url);
        if (cancelled) {
          return;
        }
        setResult(next);
        setState("ok");
      } catch (e) {
        if (cancelled) {
          return;
        }
        const msg = e instanceof Error ? e.message : "Failed to load GLB";
        setErrorMessage(msg);
        setResult(null);
        setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchUrl]);

  const totalRows = result != null ? countStudioGltfExtractionRows(result) : 0;

  return { state, result, errorMessage, totalRows };
}
