import type { PresentationPackV1 } from "../schemas/presentationPack.v1";

export async function importCoursePackDev(
  pack: PresentationPackV1,
  options: { overwrite?: boolean; activatePageId?: string } = {},
): Promise<
  | {
      ok: true;
      written: string[];
      skipped: string[];
      pageIds: string[];
      activatePageId: string | null;
    }
  | { ok: false; error: string }
> {
  if (!import.meta.env.DEV) {
    return { ok: false, error: "Pack import is only available in Vite dev mode." };
  }

  const response = await fetch("/__dev_api/course-studio/import-pack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pack,
      overwrite: options.overwrite ?? false,
      activatePageId: options.activatePageId,
    }),
  });

  const body = (await response.json()) as {
    ok?: boolean;
    error?: string;
    written?: string[];
    skipped?: string[];
    pageIds?: string[];
    activatePageId?: string | null;
  };

  if (!response.ok || body.ok !== true) {
    return { ok: false, error: body.error ?? `Import failed (${response.status})` };
  }

  return {
    ok: true,
    written: body.written ?? [],
    skipped: body.skipped ?? [],
    pageIds: body.pageIds ?? [],
    activatePageId: body.activatePageId ?? null,
  };
}
