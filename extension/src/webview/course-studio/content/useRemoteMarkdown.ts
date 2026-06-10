import { useCallback, useEffect, useState } from "react";
import { fetchRemoteMarkdown, isRemoteMarkdownUrl } from "./remoteMarkdownUrl";

type RemoteMarkdownCacheEntry = {
  text: string;
  fetchedAtMs: number;
};

const remoteMarkdownCache = new Map<string, RemoteMarkdownCacheEntry>();
const inflightRemoteMarkdown = new Map<string, Promise<string>>();

export function clearRemoteMarkdownCache(url?: string): void {
  if (url == null) {
    remoteMarkdownCache.clear();
    return;
  }
  remoteMarkdownCache.delete(url.trim());
}

async function loadRemoteMarkdown(url: string): Promise<string> {
  const key = url.trim();
  const cached = remoteMarkdownCache.get(key);
  if (cached != null) {
    return cached.text;
  }

  const pending = inflightRemoteMarkdown.get(key);
  if (pending != null) {
    return pending;
  }

  const request = fetchRemoteMarkdown(key)
    .then((text) => {
      remoteMarkdownCache.set(key, { text, fetchedAtMs: Date.now() });
      return text;
    })
    .finally(() => {
      inflightRemoteMarkdown.delete(key);
    });

  inflightRemoteMarkdown.set(key, request);
  return request;
}

export function useRemoteMarkdown(url: string | undefined): {
  markdown: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const trimmed = url?.trim() ?? "";
  const enabled = trimmed.length > 0 && isRemoteMarkdownUrl(trimmed);
  const [reloadToken, setReloadToken] = useState(0);
  const [markdown, setMarkdown] = useState<string | null>(() => {
    if (!enabled) {
      return null;
    }
    return remoteMarkdownCache.get(trimmed)?.text ?? null;
  });
  const [loading, setLoading] = useState(enabled && markdown == null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!enabled) {
      return;
    }
    clearRemoteMarkdownCache(trimmed);
    setReloadToken((value) => value + 1);
  }, [enabled, trimmed]);

  useEffect(() => {
    if (!enabled) {
      setMarkdown(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void loadRemoteMarkdown(trimmed)
      .then((text) => {
        if (cancelled) {
          return;
        }
        setMarkdown(text);
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        const message = cause instanceof Error ? cause.message : "Failed to load remote markdown";
        setError(message);
        setMarkdown(null);
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

  return { markdown, loading, error, reload };
}
