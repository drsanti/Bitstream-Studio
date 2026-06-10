export const HTML_PAGE_IFRAME_HEIGHT_MESSAGE_TYPE = "course-html-page-height";

const HTML_PAGE_AUTO_HEIGHT_SCRIPT = `<script data-course-html-page-height="1">
(function () {
  function measure() {
    var doc = document.documentElement;
    var body = document.body;
    return Math.max(
      doc ? doc.scrollHeight : 0,
      body ? body.scrollHeight : 0,
      doc ? doc.offsetHeight : 0,
      body ? body.offsetHeight : 0
    );
  }
  function report() {
    var height = measure();
    if (height > 0 && parent && typeof parent.postMessage === "function") {
      parent.postMessage({ type: "${HTML_PAGE_IFRAME_HEIGHT_MESSAGE_TYPE}", height: height }, "*");
    }
  }
  window.addEventListener("load", report);
  window.addEventListener("resize", report);
  if (typeof ResizeObserver !== "undefined" && document.documentElement) {
    new ResizeObserver(report).observe(document.documentElement);
  }
  setTimeout(report, 0);
  setTimeout(report, 120);
})();
</script>`;

/** Inject iframe height reporter for Read-mode auto sizing (srcdoc sandbox). */
export function injectHtmlPageAutoHeightScript(html: string): string {
  if (html.includes('data-course-html-page-height="1"')) {
    return html;
  }
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${HTML_PAGE_AUTO_HEIGHT_SCRIPT}</body>`);
  }
  return `${html}\n${HTML_PAGE_AUTO_HEIGHT_SCRIPT}`;
}
