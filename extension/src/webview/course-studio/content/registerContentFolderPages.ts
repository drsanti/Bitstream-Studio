import { parsePageV1 } from "../schemas/page.v1";
import { mergeContentFolderPages } from "./pageRegistry";
import { COURSE_CONTENT_ROOT_PREFIX } from "./presentationPackLoad";

const CONTENT_PAGE_JSON = import.meta.glob<{ default: unknown }>("./*.page.v1.json", {
  eager: true,
});

/** Register every `content/*.page.v1.json` for outline navigation (Vite dev / webview bundle only). */
export function registerContentFolderPages(): void {
  const entries: Record<string, { page: ReturnType<typeof parsePageV1>; sourcePath: string }> = {};
  for (const [modulePath, mod] of Object.entries(CONTENT_PAGE_JSON)) {
    const fileName = modulePath.replace(/^\.\//, "");
    const page = parsePageV1(mod.default);
    entries[page.id] = {
      page,
      sourcePath: `${COURSE_CONTENT_ROOT_PREFIX}${fileName}`,
    };
  }
  mergeContentFolderPages(entries);
}
