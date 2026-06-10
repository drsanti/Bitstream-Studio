export async function saveCourseImageDev(
  dataUrl: string,
  suggestedName: string,
): Promise<
  | { ok: true; sourcePath: string; markdownPath: string }
  | { ok: false; error: string }
> {
  if (!import.meta.env.DEV) {
    return { ok: false, error: "Image save is only available in Vite dev mode." };
  }

  const response = await fetch("/__dev_api/course-studio/save-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, suggestedName }),
  });

  const body = (await response.json()) as {
    ok?: boolean;
    error?: string;
    sourcePath?: string;
    markdownPath?: string;
  };

  if (!response.ok || body.ok !== true || body.sourcePath == null || body.markdownPath == null) {
    return { ok: false, error: body.error ?? `Save failed (${response.status})` };
  }

  return {
    ok: true,
    sourcePath: body.sourcePath,
    markdownPath: body.markdownPath,
  };
}
