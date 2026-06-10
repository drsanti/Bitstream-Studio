import { isRemoteMarkdownUrl, resolveRemoteMarkdownFetchUrl } from "./remoteMarkdownUrl";

export function isRemoteHtmlUrl(value: string): boolean {
  return isRemoteMarkdownUrl(value);
}

/** Normalize user-facing HTML URLs (GitHub blob / raw, gist, GitLab blob) to a fetchable raw URL. */
export function resolveRemoteHtmlFetchUrl(inputUrl: string): string {
  return resolveRemoteMarkdownFetchUrl(inputUrl);
}

export async function fetchRemoteHtml(sourceUrl: string): Promise<string> {
  const fetchUrl = resolveRemoteHtmlFetchUrl(sourceUrl);
  const response = await fetch(fetchUrl, {
    headers: { Accept: "text/html, text/plain, */*" },
  });
  if (!response.ok) {
    throw new Error(`Failed to load HTML (${response.status} ${response.statusText})`);
  }
  const text = await response.text();
  if (text.trim().length === 0) {
    throw new Error("Remote HTML file is empty");
  }
  return text;
}
