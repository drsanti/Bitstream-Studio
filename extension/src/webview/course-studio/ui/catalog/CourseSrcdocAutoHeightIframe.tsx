import type { RefObject } from "react";
import { COURSE_EMBED_CARD_IFRAME_CLASS } from "./course-embed-card-ui";

export function CourseSrcdocAutoHeightIframe({
  iframeRef,
  title,
  sandbox,
  srcDoc,
  scrolling,
}: {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  title: string;
  sandbox: string;
  srcDoc: string;
  scrolling?: "auto" | "no" | "yes";
}) {
  return (
    <iframe
      ref={iframeRef}
      className={COURSE_EMBED_CARD_IFRAME_CLASS}
      title={title}
      sandbox={sandbox}
      srcDoc={srcDoc}
      scrolling={scrolling}
    />
  );
}

/** Try to read document height from a same-origin loaded iframe (live src fallback). */
export function measureLiveIframeDocumentHeight(iframe: HTMLIFrameElement): number | null {
  try {
    const doc = iframe.contentDocument;
    if (doc == null) {
      return null;
    }
    const height = Math.max(
      doc.documentElement?.scrollHeight ?? 0,
      doc.body?.scrollHeight ?? 0,
      doc.documentElement?.offsetHeight ?? 0,
      doc.body?.offsetHeight ?? 0,
    );
    return height > 0 ? height : null;
  } catch {
    return null;
  }
}
