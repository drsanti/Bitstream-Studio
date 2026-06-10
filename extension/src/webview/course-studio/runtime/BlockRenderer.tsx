import { PresentationTheoryMarkdown } from "../../presentation/components/PresentationTheoryMarkdown";
import type { CourseThemesV1 } from "../schemas/courseThemes.v1";
import type { LinkHealthPolicy } from "../schemas/linkHealth";
import type { PageBlockV1, PageV1 } from "../schemas/page.v1";
import {
  resolveCardBlockEffectiveColors,
  resolveDashboardWidgetBlockEffectiveColors,
  resolveMarkdownBlockEffectiveColors,
} from "./resolveBlockColors";
import { CourseCallout } from "../ui/catalog/CourseCallout";
import { calloutVariantFromBlockKind } from "../ui/catalog/callout-tokens";
import { CourseCard } from "../ui/catalog/CourseCard";
import { CourseCodeCard } from "../ui/catalog/CourseCodeCard";
import { CourseDiagramCard } from "../ui/catalog/CourseDiagramCard";
import { CourseSceneBlockCard } from "../ui/catalog/CourseSceneBlockCard";
import { CourseHtmlPageCard } from "../ui/catalog/CourseHtmlPageCard";
import { CourseIframeCard } from "../ui/catalog/CourseIframeCard";
import { useRemoteHtml } from "../content/useRemoteHtml";
import { CourseImageCard } from "../ui/catalog/CourseImageCard";
import { CourseDashboardWidgetCard } from "../ui/catalog/CourseDashboardWidgetCard";
import { CourseWidgetBoardCard } from "../ui/catalog/widget-board/CourseWidgetBoardCard";
import { CourseLiveMetricCard } from "../ui/catalog/CourseLiveMetricCard";
import { CourseSensorTelemetryCard } from "../ui/catalog/CourseSensorTelemetryCard";
import { CourseTitleWithIcon } from "../ui/catalog/CourseTitleWithIcon";
import { CourseYoutubeCard } from "../ui/catalog/CourseYoutubeCard";
import {
  CourseMarkdownBlockContent,
  CourseMarkdownBlockShell,
} from "../ui/catalog/CourseMarkdownBlockShell";
import { useCourseMarkdown } from "../content/markdownRegistry";
import { useRemoteMarkdown } from "../content/useRemoteMarkdown";
import { youtubeEmbedOptionsFromBlock, type CourseEmbedShellHeight } from "../schemas/embedBlocks";
import { resolveMarkdownBlockContent } from "./resolveMarkdownBlockContent";
import type { CourseMarkdownShellHeight } from "../ui/catalog/CourseMarkdownBlockShell";

function MarkdownBlockRenderer({
  block,
  pageMeta,
  courseThemes,
  markdownShellHeight = "fill",
}: {
  block: Extract<PageBlockV1, { kind: "markdown" }>;
  pageMeta?: PageV1["meta"];
  courseThemes?: CourseThemesV1;
  markdownShellHeight?: CourseMarkdownShellHeight;
}) {
  const effectiveColors = resolveMarkdownBlockEffectiveColors(
    block.colors,
    pageMeta,
    courseThemes,
  );
  const remoteUrl = block.url?.trim();
  const remote = useRemoteMarkdown(remoteUrl);
  const srcMarkdown = useCourseMarkdown(block.src ?? "");
  const inlineResolved = resolveMarkdownBlockContent(block);

  if (remoteUrl != null && remoteUrl.length > 0) {
    if (remote.loading) {
      return (
        <div className="course-block-markdown flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-muted)]">
          Loading markdown…
        </div>
      );
    }
    if (remote.error != null) {
      return (
        <div className="course-block-markdown flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-rose-500/35 bg-[var(--surface-card)] px-4 py-3 text-center text-sm text-rose-200/90">
          <p>Could not load remote markdown.</p>
          <p className="text-xs text-[var(--text-muted)] break-all">{remote.error}</p>
        </div>
      );
    }
    const resolved = remote.markdown ?? block.markdown ?? "";
    return (
      <CourseMarkdownBlockContent
        markdown={resolved}
        colors={effectiveColors}
        height={markdownShellHeight}
      />
    );
  }

  const resolved =
    block.src != null
      ? (srcMarkdown ?? block.markdown ?? "")
      : inlineResolved.markdown;

  if (block.src != null && srcMarkdown == null && block.markdown == null) {
    return (
      <div className="course-block-markdown flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-muted)]">
        Missing markdown file: {block.src}
      </div>
    );
  }

  return (
    <CourseMarkdownBlockContent
      markdown={resolved}
      colors={effectiveColors}
      height={markdownShellHeight}
    />
  );
}

function HtmlPageBlockRenderer({
  block,
  embedShellHeight = "fill",
  embedReadContentHeightPx,
}: {
  block: Extract<PageBlockV1, { kind: "html-page" }>;
  embedShellHeight?: CourseEmbedShellHeight;
  embedReadContentHeightPx?: number;
}) {
  const remoteUrl = block.url?.trim();
  const remote = useRemoteHtml(remoteUrl);

  if (remoteUrl != null && remoteUrl.length > 0) {
    if (remote.loading) {
      return (
        <div className="course-block-html-page flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-muted)]">
          Loading HTML…
        </div>
      );
    }
    if (remote.error != null) {
      return (
        <div className="course-block-html-page flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-rose-500/35 bg-[var(--surface-card)] px-4 py-3 text-center text-sm text-rose-200/90">
          <p>Could not load remote HTML.</p>
          <p className="text-xs text-[var(--text-muted)] break-all">{remote.error}</p>
        </div>
      );
    }
    return (
      <CourseHtmlPageCard
        html={remote.html ?? block.html ?? ""}
        title={block.title}
        caption={block.caption}
        captionPlacement={block.captionPlacement}
        shellHeight={embedShellHeight}
        readContentHeightPx={embedReadContentHeightPx}
        sandboxSameOrigin={block.sandboxSameOrigin}
      />
    );
  }

  return (
    <CourseHtmlPageCard
      html={block.html ?? ""}
      title={block.title}
      caption={block.caption}
      captionPlacement={block.captionPlacement}
      shellHeight={embedShellHeight}
      readContentHeightPx={embedReadContentHeightPx}
      sandboxSameOrigin={block.sandboxSameOrigin}
    />
  );
}

export function BlockRenderer({
  block,
  pageMeta,
  courseThemes,
  pageLinkHealth,
  pageStaleMs,
  markdownShellHeight = "fill",
  embedShellHeight = "fill",
  embedReadContentHeightPx,
}: {
  block: PageBlockV1;
  pageMeta?: PageV1["meta"];
  courseThemes?: CourseThemesV1;
  pageLinkHealth?: LinkHealthPolicy;
  pageStaleMs?: number;
  /** Markdown shell only — other blocks always fill the grid cell. */
  markdownShellHeight?: CourseMarkdownShellHeight;
  /** YouTube / iFrame embed shell in Read mode. */
  embedShellHeight?: CourseEmbedShellHeight;
  /** iFrame / HTML page Read fixed height in px; auto mode measures document height. */
  embedReadContentHeightPx?: number;
}) {
  switch (block.kind) {
    case "heading":
      return (
        <div className="flex h-full min-w-0 max-w-full flex-col justify-center gap-2">
          {block.eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-amber)]">
              {block.eyebrow}
            </p>
          ) : null}
          <CourseTitleWithIcon
            title={block.title}
            icon={block.icon}
            iconColor={block.iconColor}
            iconSize={28}
            titleAs="h1"
            titleClassName="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]"
            iconClassName={
              block.iconColor != null ? undefined : "text-[var(--accent-amber)]"
            }
            iconAnimation={block.iconAnimation}
            className="items-center"
          />
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
          iconColor={block.iconColor}
          iconAnimation={block.iconAnimation}
        />
      );
    case "markdown":
      return (
        <MarkdownBlockRenderer
          block={block}
          pageMeta={pageMeta}
          courseThemes={courseThemes}
          markdownShellHeight={markdownShellHeight}
        />
      );
    case "card":
      return (
        <CourseCard
          title={block.title}
          body={block.body}
          icon={block.icon}
          iconAnimation={block.iconAnimation}
          colors={resolveCardBlockEffectiveColors(block.colors, pageMeta, courseThemes)}
        />
      );
    case "live-metric":
      return (
        <CourseLiveMetricCard
          title={block.title}
          icon={block.icon}
          iconColor={block.iconColor}
          iconAnimation={block.iconAnimation}
          axes={block.axes}
          staleMs={pageStaleMs}
        />
      );
    case "dashboard-widget":
      return (
        <CourseDashboardWidgetCard
          block={block}
          colors={resolveDashboardWidgetBlockEffectiveColors(block.colors, pageMeta, courseThemes)}
          staleMs={pageStaleMs}
        />
      );
    case "widget-board":
      return <CourseWidgetBoardCard block={block} staleMs={pageStaleMs} />;
    case "sensor-telemetry-card":
      return (
        <CourseSensorTelemetryCard
          preset={block.preset}
          appearance={block.appearance}
          pageMeta={pageMeta}
        />
      );
    case "diagram-2d":
      return (
        <CourseDiagramCard
          diagramId={block.diagramId}
          caption={block.caption}
          pageLinkHealth={pageLinkHealth}
          pageStaleMs={pageStaleMs}
        />
      );
    case "scene-3d":
      return (
        <CourseSceneBlockCard
          documentId={block.documentId}
          caption={block.caption}
          pageLinkHealth={pageLinkHealth}
          pageStaleMs={pageStaleMs}
        />
      );
    case "image":
      return (
        <CourseImageCard
          src={block.src}
          alt={block.alt}
          caption={block.caption}
          fit={block.fit}
        />
      );
    case "code":
      return (
        <CourseCodeCard
          language={block.language}
          code={block.code}
          caption={block.caption}
        />
      );
    case "youtube":
      return (
        <CourseYoutubeCard
          url={block.url}
          caption={block.caption}
          captionPlacement={block.captionPlacement}
          embed={youtubeEmbedOptionsFromBlock(block)}
          shellHeight={embedShellHeight}
        />
      );
    case "iframe":
      return (
        <CourseIframeCard
          src={block.src}
          title={block.title}
          caption={block.caption}
          captionPlacement={block.captionPlacement}
          shellHeight={embedShellHeight}
          readContentHeightPx={embedReadContentHeightPx}
        />
      );
    case "html-page":
      return (
        <HtmlPageBlockRenderer
          block={block}
          embedShellHeight={embedShellHeight}
          embedReadContentHeightPx={embedReadContentHeightPx}
        />
      );
    default:
      return null;
  }
}
