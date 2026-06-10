import { useCallback, useEffect, useState } from "react";
import { fetchRemoteHtml, isRemoteHtmlUrl } from "./remoteHtmlUrl";

type RemoteHtmlCacheEntry = {
  text: string;
  fetchedAtMs: number;
};

const remoteHtmlCache = new Map<string, RemoteHtmlCacheEntry>();

export function clearRemoteHtmlCache(url?: string): void {
  if (url == null) {
    remoteHtmlCache.clear();
    return;
  }
  remoteHtmlCache.delete(url.trim());
}

async function loadRemoteHtml(url: string): Promise<string> {
  const trimmed = url.trim();
  const cached = remoteHtmlCache.get(trimmed);
  if (cached != null) {
    return cached.text;
  }
  const text = await fetchRemoteHtml(trimmed);
  remoteHtmlCache.set(trimmed, { text, fetchedAtMs: Date.now() });
  return text;
}

export function useRemoteHtml(url: string | undefined): {
  html: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const trimmed = url?.trim() ?? "";
  const enabled = trimmed.length > 0 && isRemoteHtmlUrl(trimmed);
  const [reloadToken, setReloadToken] = useState(0);
  const [html, setHtml] = useState<string | null>(() => {
    if (!enabled) {
      return null;
    }
    return remoteHtmlCache.get(trimmed)?.text ?? null;
  });
  const [loading, setLoading] = useState(enabled && html == null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!enabled) {
      return;
    }
    clearRemoteHtmlCache(trimmed);
    setReloadToken((value) => value + 1);
  }, [enabled, trimmed]);

  useEffect(() => {
    if (!enabled) {
      setHtml(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void loadRemoteHtml(trimmed)
      .then((text) => {
        if (cancelled) {
          return;
        }
        setHtml(text);
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        const message = cause instanceof Error ? cause.message : "Failed to load remote HTML";
        setError(message);
        setHtml(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, trimmed, reloadToken]);

  return { html, loading, error, reload };
}
