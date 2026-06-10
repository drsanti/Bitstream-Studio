import { useEffect, useState, type RefObject } from "react";
import {
  IFRAME_READ_HEIGHT_MAX_PX,
  IFRAME_READ_HEIGHT_MIN_PX,
} from "../../schemas/embedBlocks";
import { HTML_PAGE_IFRAME_HEIGHT_MESSAGE_TYPE } from "../../schemas/htmlPageAutoHeight";

function clampHtmlPageIframeHeight(height: number): number {
  return Math.min(
    IFRAME_READ_HEIGHT_MAX_PX,
    Math.max(IFRAME_READ_HEIGHT_MIN_PX, Math.round(height)),
  );
}

/** Listen for height reports from a sandboxed srcdoc iframe (matched by contentWindow). */
export function useCourseHtmlPageIframeHeight(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
  srcDoc: string,
): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    setHeight(null);
  }, [enabled, srcDoc]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onMessage = (event: MessageEvent) => {
      const iframe = iframeRef.current;
      if (iframe == null || event.source !== iframe.contentWindow) {
        return;
      }
      const data = event.data;
      if (data == null || typeof data !== "object") {
        return;
      }
      const payload = data as { type?: string; height?: unknown };
      if (payload.type !== HTML_PAGE_IFRAME_HEIGHT_MESSAGE_TYPE) {
        return;
      }
      if (typeof payload.height !== "number" || !Number.isFinite(payload.height)) {
        return;
      }
      const next = clampHtmlPageIframeHeight(payload.height);
      setHeight((prev) => (prev === next ? prev : next));
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [enabled, iframeRef, srcDoc]);

  return height;
}
