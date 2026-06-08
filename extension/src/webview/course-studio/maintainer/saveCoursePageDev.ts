import type { PageV1 } from "../schemas/page.v1";

export async function saveCoursePageDev(
  sourcePath: string,
  page: PageV1,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!import.meta.env.DEV) {
    return { ok: false, error: "Save is only available in Vite dev mode." };
  }

  const response = await fetch("/__dev_api/course-studio/save-page", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourcePath, page }),
  });

  const body = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || body.ok !== true) {
    return { ok: false, error: body.error ?? `Save failed (${response.status})` };
  }
  return { ok: true };
}
