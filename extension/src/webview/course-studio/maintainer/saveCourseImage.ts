import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview";
import { saveCourseImageDev } from "./saveCourseImageDev";
import { saveCourseImageExtension } from "./saveCourseImageExtension";

export async function saveCourseImage(
  dataUrl: string,
  suggestedName: string,
): Promise<
  | { ok: true; sourcePath: string; markdownPath: string }
  | { ok: false; error: string }
> {
  if (import.meta.env.DEV) {
    return saveCourseImageDev(dataUrl, suggestedName);
  }
  if (isVsCodeExtensionWebview()) {
    return saveCourseImageExtension(dataUrl, suggestedName);
  }
  return { ok: false, error: "Image save requires dev mode or VS Code extension." };
}
