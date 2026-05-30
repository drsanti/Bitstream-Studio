import { Users, X } from "lucide-react";
import { useRemoteCollaboratorSyncStore } from "../../bitstream-app/state/remoteCollaboratorSync.store.js";

export type RemoteSyncNoticeViewProps = {
  line: string | null;
  onDismiss?: () => void;
  /** Optional extra classes on the outer chip (e.g. density for toolbar vs lifecycle bar). */
  className?: string;
};

/**
 * Presentational strip for aggregated “another session updated device state” copy.
 * Wire to {@link useRemoteCollaboratorSyncStore} or pass props from another source.
 */
export function RemoteSyncNoticeView(props: RemoteSyncNoticeViewProps)
{
  const { line, onDismiss, className } = props;
  if (line == null || line.length === 0)
  {
    return null;
  }
  const outer =
    "flex min-w-0 max-w-[min(480px,52vw)] items-center gap-1.5 rounded-md border border-violet-400/35 bg-violet-950/35 px-2 py-1 text-[10px] leading-snug text-violet-100/95 shadow-[0_4px_14px_rgba(0,0,0,0.28)]";
  return (
    <div
      className={`${outer}${className != null && className.length > 0 ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Users className="h-3 w-3 shrink-0 text-violet-300/90" strokeWidth={2.25} aria-hidden />
      <span className="min-w-0 flex-1 truncate font-medium">{line}</span>
      {onDismiss != null ? (
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-violet-500/35 bg-violet-950/40 text-violet-200/90 hover:bg-violet-900/45 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-400/50"
          aria-label="Dismiss remote update notice"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/** Subscribes to {@link useRemoteCollaboratorSyncStore} for Bitstream shell usage. */
export function RemoteSyncNotice()
{
  const line = useRemoteCollaboratorSyncStore((s) => s.line);
  const dismiss = useRemoteCollaboratorSyncStore((s) => s.dismiss);
  return <RemoteSyncNoticeView line={line} onDismiss={dismiss} />;
}

