import type { PresentationPackV1 } from "../schemas/presentationPack.v1";
import { parsePresentationPackV1 } from "../schemas/presentationPack.v1";
import { reloadCourseContentRuntime } from "../content/reloadCourseContentRuntime";
import { useCoursePackStore } from "../content/useCoursePackStore";

function resolveReloadPageId(
  pageIds: string[],
  preferred?: string | null,
): string | null {
  if (preferred != null && pageIds.includes(preferred)) {
    return preferred;
  }
  return pageIds[0] ?? null;
}

export async function reloadCourseContentDev(
  activePageId?: string,
): Promise<
  | { ok: true; pageIds: string[]; activePageId: string }
  | { ok: false; error: string }
> {
  if (!import.meta.env.DEV) {
    return { ok: false, error: "Content reload is only available in Vite dev mode." };
  }

  const response = await fetch("/__dev_api/course-studio/reload-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activePageId }),
  });

  const body = (await response.json()) as {
    ok?: boolean;
    error?: string;
    pack?: PresentationPackV1;
    activePageId?: string;
    pageIds?: string[];
  };

  if (!response.ok || body.ok !== true || body.pack == null) {
    return { ok: false, error: body.error ?? `Reload failed (${response.status})` };
  }

  const pack = parsePresentationPackV1(body.pack);
  const pageIds = body.pageIds ?? [];
  const preferred =
    body.activePageId ??
    activePageId ??
    useCoursePackStore.getState().activePageId;
  const primaryPageId = resolveReloadPageId(pageIds, preferred);

  if (primaryPageId == null) {
    return { ok: false, error: "Reload failed: no pages found in content/." };
  }

  reloadCourseContentRuntime(pack, primaryPageId);
  useCoursePackStore.getState().setActivePageId(primaryPageId);

  return {
    ok: true,
    pageIds,
    activePageId: primaryPageId,
  };
}
