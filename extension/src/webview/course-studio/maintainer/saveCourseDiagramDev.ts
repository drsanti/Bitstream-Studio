import type { DiagramV1 } from "../schemas/diagram.v1";

export async function saveCourseDiagramDev(
  sourcePath: string,
  diagram: DiagramV1,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!import.meta.env.DEV) {
    return { ok: false, error: "Save is only available in Vite dev mode." };
  }

  const response = await fetch("/__dev_api/course-studio/save-diagram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourcePath, diagram }),
  });

  const body = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || body.ok !== true) {
    return { ok: false, error: body.error ?? `Save failed (${response.status})` };
  }
  return { ok: true };
}
