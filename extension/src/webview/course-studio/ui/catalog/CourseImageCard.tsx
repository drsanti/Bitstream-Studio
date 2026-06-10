import { resolveRemoteMarkdownFetchUrl, isRemoteMarkdownUrl } from "../../content/remoteMarkdownUrl";

export function CourseImageCard({
  src,
  alt,
  caption,
  fit = "contain",
}: {
  src: string;
  alt?: string;
  caption?: string;
  fit?: "contain" | "cover";
}) {
  const resolvedSrc =
    isRemoteMarkdownUrl(src.trim()) ? resolveRemoteMarkdownFetchUrl(src) : src;

  return (
    <figure className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)]">
      <div className="relative min-h-0 flex-1 bg-zinc-950/40">
        <img
          src={resolvedSrc}
          alt={alt ?? ""}
          className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
          loading="lazy"
        />
      </div>
      {caption != null && caption.length > 0 ? (
        <figcaption className="shrink-0 border-t border-[var(--surface-border)] px-3 py-2 text-2xs text-[var(--text-secondary)]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
