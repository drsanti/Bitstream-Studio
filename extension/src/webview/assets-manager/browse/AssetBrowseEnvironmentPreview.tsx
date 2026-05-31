import { useCallback, useState } from "react";
import { TRNMenuSectionTitle } from "../../ui/TRN/index.js";

const FACE_LABELS = ["+X", "−X", "+Y", "−Y", "+Z", "−Z"] as const;

type FaceThumbProps = {
  url: string;
  label: string;
};

function FaceThumb(props: FaceThumbProps) {
  const { url, label } = props;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const onLoad = useCallback(() => {
    setLoaded(true);
    setFailed(false);
  }, []);

  const onError = useCallback(() => {
    setFailed(true);
    setLoaded(false);
  }, []);

  return (
    <div className="relative aspect-square overflow-hidden rounded border border-zinc-700/70 bg-zinc-950/80">
      {!failed ? (
        <img
          src={url}
          alt=""
          className={`size-full object-cover transition-opacity duration-150 ${loaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          decoding="async"
          onLoad={onLoad}
          onError={onError}
        />
      ) : null}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-0.5 text-center ${
          failed || !loaded ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="text-[8px] font-semibold text-zinc-400">{label}</span>
        {failed ? <span className="text-[7px] leading-tight text-zinc-600">No load</span> : null}
      </div>
      {!failed && loaded ? (
        <span className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/55 px-0.5 py-px text-center text-[7px] font-medium text-zinc-200">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export type AssetBrowserEnvironmentPreviewProps = {
  /** When six JPEG (or image) faces exist — cubemap strip preview. */
  faceUrls: string[] | undefined;
  /** Fallback when there is no cubemap (e.g. single external image URL). */
  primaryUrl: string;
};

function isLikelyRasterUrl(url: string): boolean {
  return /\.(jpe?g|png|webp|gif)(\?|#|$)/i.test(url);
}

/**
 * Compact cubemap / environment preview for the Asset Browser (no R3F — six thumbnails + optional single image).
 */
export function AssetBrowseEnvironmentPreview(props: AssetBrowserEnvironmentPreviewProps) {
  const { faceUrls, primaryUrl } = props;

  if (faceUrls != null && faceUrls.length === 6 && faceUrls.every((u) => u.length > 0)) {
    return (
      <div className="space-y-1">
        <TRNMenuSectionTitle spacing="labelOnly">Cubemap preview</TRNMenuSectionTitle>
        <div className="grid grid-cols-3 gap-0.5">
          {faceUrls.map((url, i) => (
            <FaceThumb key={`${url}-${i}`} url={url} label={FACE_LABELS[i] ?? `F${i}`} />
          ))}
        </div>
      </div>
    );
  }

  if (primaryUrl.length > 0 && isLikelyRasterUrl(primaryUrl)) {
    return (
      <div className="space-y-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Preview</div>
        <div className="relative aspect-video max-h-24 overflow-hidden rounded border border-zinc-700/70 bg-zinc-950/80">
          <img
            src={primaryUrl}
            alt=""
            className="size-full object-contain object-center"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    );
  }

  if (primaryUrl.length > 0) {
    return (
      <div className="space-y-1">
        <TRNMenuSectionTitle spacing="labelOnly">Preview</TRNMenuSectionTitle>
        <div className="rounded border border-zinc-800/80 bg-zinc-950/60 px-1.5 py-1 text-[9px] leading-snug text-zinc-500">
          No image preview available for this environment.
        </div>
      </div>
    );
  }

  return null;
}

/** @deprecated Use {@link AssetBrowseEnvironmentPreview}. */
export const AssetBrowserEnvironmentPreview = AssetBrowseEnvironmentPreview;
