import { TRNFormField } from "../../ui/TRN/TRNForm";
import { CourseMaintainerScrubNumberInput } from "./CourseMaintainerScrubNumberInput";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInlineToggleRow } from "../../ui/TRN/TRNInlineToggleRow";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { LinkHealthPolicy } from "../schemas/linkHealth";
import { DEFAULT_LINK_HEALTH_POLICY } from "../schemas/linkHealth";
import type { TelemetryPreferenceV1 } from "../schemas/pageMeta";
import { DEFAULT_PAGE_META } from "../schemas/pageMeta";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

const TELEMETRY_OPTIONS: { value: TelemetryPreferenceV1; label: string }[] = [
  { value: "auto", label: "Auto (toolbar route)" },
  { value: "uart", label: "Bitstream (UART)" },
  { value: "simulator", label: "Simulator" },
];

const LINK_HEALTH_OPTIONS: { value: LinkHealthPolicy; label: string }[] = [
  { value: "freeze-gray", label: "Freeze + gray (default)" },
  { value: "last-no-style", label: "Freeze, keep color" },
  { value: "fallback", label: "Binding fallbacks" },
  { value: "hide", label: "Hide when stale" },
];

export function CourseDocumentIdentityFields() {
  const page = useCoursePageEditorStore((s) => s.page);
  const updatePageTitle = useCoursePageEditorStore((s) => s.updatePageTitle);

  if (page == null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <TRNFormField id="page-title" label="Page title">
        <TRNInput
          id="page-title"
          variant="outlined"
          size="sm"
          className="w-full"
          value={page.title}
          onChange={(e) => updatePageTitle(e.target.value)}
        />
      </TRNFormField>
      <TRNFormField id="page-id" label="Page id">
        <TRNInput
          id="page-id"
          variant="outlined"
          size="sm"
          className="w-full"
          value={page.id}
          readOnly
          disabled
        />
      </TRNFormField>
    </div>
  );
}

export function CourseTelemetryLinkHealthFields() {
  const page = useCoursePageEditorStore((s) => s.page);
  const updatePageMeta = useCoursePageEditorStore((s) => s.updatePageMeta);

  if (page == null) {
    return null;
  }

  const meta = { ...DEFAULT_PAGE_META, ...page.meta };
  const staleEnabled = meta.staleMs != null;

  return (
    <div className="flex flex-col gap-3">
      <TRNFormField
        id="telemetry-pref"
        label="Telemetry preference"
        hint="Auto follows the toolbar Bitstream / Simulator route."
      >
        <TRNSelect
          value={meta.telemetryPreference}
          ariaLabel="Telemetry preference"
          options={TELEMETRY_OPTIONS}
          onValueChange={(value) =>
            updatePageMeta({ telemetryPreference: value as TelemetryPreferenceV1 })
          }
        />
      </TRNFormField>
      <TRNFormField id="link-health" label="Default link health">
        <TRNSelect
          value={meta.defaultLinkHealth ?? DEFAULT_LINK_HEALTH_POLICY}
          ariaLabel="Default link health policy"
          options={LINK_HEALTH_OPTIONS}
          onValueChange={(value) =>
            updatePageMeta({ defaultLinkHealth: value as LinkHealthPolicy })
          }
        />
      </TRNFormField>
      <TRNInlineToggleRow
        label="Stale timeout"
        hint="When enabled, samples older than the threshold count as stale for badges and diagrams."
        checked={staleEnabled}
        ariaLabel="Enable stale timeout"
        onCheckedChange={(checked) => {
          if (checked) {
            updatePageMeta({ staleMs: meta.staleMs ?? 2000 });
          } else {
            updatePageMeta({ staleMs: undefined });
          }
        }}
      />
      {staleEnabled ? (
        <TRNFormField id="stale-ms" label="Stale after (ms)">
          <CourseMaintainerScrubNumberInput
            value={meta.staleMs ?? 2000}
            min={250}
            max={60000}
            step={250}
            onChange={(staleMs) => updatePageMeta({ staleMs })}
          />
        </TRNFormField>
      ) : null}
      <TRNHintText>Status chips in the Course Studio header reflect route and link health.</TRNHintText>
    </div>
  );
}
