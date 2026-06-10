const HTTP_URL_PATTERN = /^https?:\/\//i;
const GITHUB_README_FILE = "README.md";

export function isRemoteMarkdownUrl(value: string): boolean {
  return HTTP_URL_PATTERN.test(value.trim());
}

function githubHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function githubRawMarkdownUrl(owner: string, repo: string, ref: string, path: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
}

/**
 * Normalize user-facing markdown URLs (GitHub blob / raw / repo root) to a fetchable raw URL.
 */
export function resolveRemoteMarkdownFetchUrl(inputUrl: string): string {
  const trimmed = inputUrl.trim();
  if (!isRemoteMarkdownUrl(trimmed)) {
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return trimmed;
  }

  if (githubHostname(url.hostname) === "github.com") {
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length === 2) {
      const [owner, repo] = parts;
      return githubRawMarkdownUrl(owner, repo, "HEAD", GITHUB_README_FILE);
    }

    if (parts.length >= 4 && parts[2] === "tree") {
      const owner = parts[0];
      const repo = parts[1];
      const ref = parts[3];
      if (parts.length === 4) {
        return githubRawMarkdownUrl(owner, repo, ref, GITHUB_README_FILE);
      }
      const path = parts.slice(4).join("/");
      if (path.toLowerCase().endsWith(".md")) {
        return githubRawMarkdownUrl(owner, repo, ref, path);
      }
    }

    if (parts.length >= 5 && parts[2] === "blob") {
      const owner = parts[0];
      const repo = parts[1];
      const ref = parts[3];
      const path = parts.slice(4).join("/");
      return githubRawMarkdownUrl(owner, repo, ref, path);
    }
    if (parts.length >= 5 && parts[2] === "raw") {
      const owner = parts[0];
      const repo = parts[1];
      const ref = parts[3];
      const path = parts.slice(4).join("/");
      return githubRawMarkdownUrl(owner, repo, ref, path);
    }
  }

  if (url.hostname === "gist.github.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[1].endsWith(".md")) {
      return `https://gist.githubusercontent.com/${parts[0]}/${parts[1]}/raw`;
    }
    if (parts.length >= 1) {
      return `https://gist.githubusercontent.com/${parts[0]}/raw`;
    }
  }

  if (url.hostname === "gitlab.com" && url.pathname.includes("/-/blob/")) {
    const blobIndex = url.pathname.indexOf("/-/blob/");
    const projectPath = url.pathname.slice(0, blobIndex);
    const afterBlob = url.pathname.slice(blobIndex + "/-/blob/".length);
    const slash = afterBlob.indexOf("/");
    if (slash >= 0) {
      const ref = afterBlob.slice(0, slash);
      const path = afterBlob.slice(slash + 1);
      return `https://gitlab.com${projectPath}/-/raw/${ref}/${path}`;
    }
  }

  return trimmed;
}

export async function fetchRemoteMarkdown(sourceUrl: string): Promise<string> {
  const fetchUrl = resolveRemoteMarkdownFetchUrl(sourceUrl);
  const response = await fetch(fetchUrl, {
    headers: { Accept: "text/plain, text/markdown, */*" },
  });
  if (!response.ok) {
    throw new Error(`Failed to load markdown (${response.status} ${response.statusText})`);
  }
  const text = await response.text();
  if (text.trim().length === 0) {
    throw new Error("Remote markdown file is empty");
  }
  return text;
}
