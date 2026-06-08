import { useBitstreamTelemetrySourceStore } from "../../bitstream-app/state/bitstreamTelemetrySource.store";
import type { PageMetaV1 } from "../schemas/pageMeta";
import { useCourseTelemetryLinkState } from "./useCourseTelemetryLinkState";

export function CourseDocumentStatusBadge({ meta }: { meta?: PageMetaV1 }) {
  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const { healthy, transportUp } = useCourseTelemetryLinkState(meta?.staleMs);

  const preference = meta?.telemetryPreference ?? "auto";
  const routeLabel =
    preference === "simulator"
      ? "Simulator"
      : preference === "uart"
        ? "Bitstream"
        : backend === "simulator"
          ? "Simulator"
          : "Bitstream";

  const dataLabel = healthy ? "Live" : transportUp ? "Stale" : "No link";

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="rounded-full border px-2 py-0.5 text-2xs font-semibold"
        style={{
          color: backend === "simulator" ? "var(--status-sim)" : "var(--accent-cyan)",
          borderColor:
            backend === "simulator"
              ? "color-mix(in srgb, var(--status-sim) 35%, transparent)"
              : "color-mix(in srgb, var(--accent-cyan) 35%, transparent)",
        }}
      >
        {routeLabel}
      </span>
      <span
        className="rounded-full border px-2 py-0.5 text-2xs font-semibold"
        style={{
          color: healthy ? "var(--status-live)" : "var(--text-muted)",
          borderColor: healthy
            ? "color-mix(in srgb, var(--status-live) 35%, transparent)"
            : "var(--surface-border)",
        }}
      >
        {dataLabel}
      </span>
    </div>
  );
}
