import { parseSceneV1, type SceneV1 } from "../schemas/scene.v1";

export function serializeSceneV1Document(scene: SceneV1): string {
  const validated = parseSceneV1(scene);
  return `${JSON.stringify(validated, null, 2)}\n`;
}

export function parseSceneV1DocumentJson(text: string): SceneV1 {
  const raw = JSON.parse(text) as unknown;
  return parseSceneV1(raw);
}

export async function copySceneV1ToClipboard(scene: SceneV1): Promise<void> {
  const text = serializeSceneV1Document(scene);
  if (navigator.clipboard?.writeText != null) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("Clipboard is not available in this environment.");
}

export function downloadSceneV1Json(scene: SceneV1, filename: string): void {
  const text = serializeSceneV1Document(scene);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".scene.v1.json")
    ? filename
    : `${filename}.scene.v1.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function readSceneV1FromFileInput(file: File): Promise<SceneV1> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        resolve(parseSceneV1DocumentJson(text));
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsText(file);
  });
}
