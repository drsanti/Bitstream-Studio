import { saveCourseImage } from "../saveCourseImage";

export function readClipboardImageFile(data: DataTransfer): File | null {
  for (const item of data.items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file != null) {
        return file;
      }
    }
  }
  return null;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read image file."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export async function resolvePastedImageMarkdown(
  file: File,
): Promise<{ markdownPath: string; alt: string } | { dataUrl: string; alt: string }> {
  const alt = file.name.replace(/\.[^.]+$/, "") || "image";
  const dataUrl = await fileToDataUrl(file);

  const saved = await saveCourseImage(dataUrl, file.name);
  if (saved.ok) {
    return { markdownPath: saved.markdownPath, alt };
  }

  return { dataUrl, alt };
}

export function imageMarkdownFromPaste(
  resolved: { markdownPath: string; alt: string } | { dataUrl: string; alt: string },
): string {
  if ("markdownPath" in resolved) {
    return `![${resolved.alt}](${resolved.markdownPath})`;
  }
  return `![${resolved.alt}](${resolved.dataUrl})`;
}
