import { PresentationTheoryMarkdown } from "../../presentation/components/PresentationTheoryMarkdown";
import type { LinkHealthPolicy } from "../schemas/linkHealth";
import type { PageBlockV1 } from "../schemas/page.v1";
import { CourseCallout } from "../ui/catalog/CourseCallout";
import { calloutVariantFromBlockKind } from "../ui/catalog/callout-tokens";
import { CourseCard } from "../ui/catalog/CourseCard";
import { CourseDiagramCard } from "../ui/catalog/CourseDiagramCard";
import { CourseDiagram3DCard } from "../ui/catalog/CourseDiagram3DCard";
import { CourseLiveMetricCard } from "../ui/catalog/CourseLiveMetricCard";
import { useCourseMarkdown } from "../content/markdownRegistry";
import { resolveMarkdownBlockContent } from "./resolveMarkdownBlockContent";

function MarkdownBlockRenderer({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "markdown" }>;
}) {
  const srcMarkdown = useCourseMarkdown(block.src ?? "");
  const resolved =
    block.src != null
      ? (srcMarkdown ?? block.markdown ?? "")
      : resolveMarkdownBlockContent(block).markdown;

  if (block.src != null && srcMarkdown == null && block.markdown == null) {
    return (
      <div className="course-block-markdown flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-muted)]">
        Missing markdown file: {block.src}
      </div>
    );
  }

  return (
    <div className="course-block-markdown h-full min-h-0 overflow-y-auto scrollbar-hide rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3">
      <PresentationTheoryMarkdown markdown={resolved} />
    </div>
  );
}

export function BlockRenderer({
  block,
  pageLinkHealth,
  pageStaleMs,
}: {
  block: PageBlockV1;
  pageLinkHealth?: LinkHealthPolicy;
  pageStaleMs?: number;
}) {
  switch (block.kind) {
    case "heading":
      return (
        <div className="flex h-full flex-col justify-center gap-2">
          {block.eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-amber)]">
              {block.eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">{block.title}</h1>
          {block.subtitle ? (
            <p className="max-w-3xl text-base text-[var(--text-secondary)]">{block.subtitle}</p>
          ) : null}
        </div>
      );
    case "callout-info":
    case "callout-warning":
    case "callout-danger":
    case "callout-tip":
      return (
        <CourseCallout
          variant={calloutVariantFromBlockKind(block.kind)}
          title={block.title}
          body={block.body}
          icon={block.icon}
        />
      );
    case "markdown":
      return <MarkdownBlockRenderer block={block} />;
    case "card":
      return <CourseCard title={block.title} body={block.body} />;
    case "live-metric":
      return <CourseLiveMetricCard title={block.title} />;
    case "diagram-2d":
      return (
        <CourseDiagramCard
          diagramId={block.diagramId}
          caption={block.caption}
          pageLinkHealth={pageLinkHealth}
          pageStaleMs={pageStaleMs}
        />
      );
    case "diagram-3d":
      return (
        <CourseDiagram3DCard
          sceneId={block.sceneId}
          caption={block.caption}
          pageStaleMs={pageStaleMs}
        />
      );
    default:
      return null;
  }
}
