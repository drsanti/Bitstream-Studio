import { Link2 } from "lucide-react";
import { useId, useState } from "react";
import { twMerge } from "tailwind-merge";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRN_HINT_HOVER_DELAY_MS } from "../../../ui/TRN/TRNHintText";
import { TRNTooltip } from "../../../ui/TRN/TRNTooltip";
import {
  TRN_FIELD_CONTROL_FIELD_VARIANT_CLASS,
  TRN_FIELD_CONTROL_TRIGGER_BASE_CLASS,
} from "../../../ui/TRN/trnFieldControlClasses";
import type { DiagramBindingV1 } from "../../schemas/diagram.v1";
import { catalogEntryForPath } from "../../runtime/diagram/diagramBindingCatalog";
import { hasScaleMapOp } from "../../runtime/diagram/diagramNodeMutations";
import { useCourseLiveBinding } from "../../runtime/useCourseLiveBinding";
import { CourseBindingDisplayUnitFields } from "./CourseBindingDisplayUnitFields";
import { CourseBindingPreviewStrip } from "./CourseBindingPreviewStrip";
import { CourseParameterMappingDialog } from "./CourseParameterMappingDialog";

export function CourseLiveBindingField({
  label,
  binding,
  valueKind = "number",
  staleMs,
  onChange,
  hint,
  includeDisplayUnitFields = true,
}: {
  label: string;
  binding: DiagramBindingV1 | null | undefined;
  valueKind?: "number" | "boolean";
  staleMs?: number;
  onChange: (next: DiagramBindingV1 | null) => void;
  hint?: string;
  /** When false, unit override / display-unit selectors render outside this field (e.g. own inspector card). */
  includeDisplayUnitFields?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const fieldId = useId();
  const live = useCourseLiveBinding(binding, staleMs);

  const summaryPath = live.binding?.path ?? "Not mapped";
  const summaryDisplayText =
    live.binding != null ? live.displayText : "Click to bind live data";
  const summaryUnit = live.binding != null ? live.unit : "";

  const openDialog = () => setDialogOpen(true);
  const catalogUnit =
    binding?.path != null ? catalogEntryForPath(binding.path)?.unit : undefined;
  const showDisplayUnit =
    valueKind === "number" && binding?.path != null && binding.path.length > 0;
  const mapRangeActive =
    binding?.path != null && binding.path.length > 0 && hasScaleMapOp(binding);

  return (
    <>
      <div className="flex flex-col gap-2">
        <TRNFormField
          id={fieldId}
          label={label}
          hint={hint}
          labelTrailing={
            mapRangeActive ? (
              <span
                className="pointer-events-none inline-flex shrink-0 items-center rounded-full border border-cyan-500/20 bg-cyan-950/50 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-cyan-300/90"
                aria-label="Map range transform active"
              >
                Map range
              </span>
            ) : undefined
          }
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={twMerge(
                "inline-flex min-w-0 flex-1 items-center rounded-md px-2.5 py-1 text-left",
                TRN_FIELD_CONTROL_TRIGGER_BASE_CLASS,
                live.binding != null
                  ? TRN_FIELD_CONTROL_FIELD_VARIANT_CLASS
                  : "border border-dashed border-zinc-700/60 bg-zinc-950/30 hover:border-zinc-600/70 hover:bg-zinc-950/45",
              )}
              onClick={openDialog}
              aria-label={`Map ${label} to live data`}
            >
              <CourseBindingPreviewStrip
                compact
                pathLabel={summaryPath}
                displayText={summaryDisplayText}
                unit={summaryUnit}
                health={live.health}
              />
            </button>
            <TRNTooltip
              content="Open parameter mapping"
              openDelayMs={TRN_HINT_HOVER_DELAY_MS}
              triggerWrapper="span"
              triggerClassName="inline-flex shrink-0"
              trigger={
                <button
                  type="button"
                  className={twMerge(
                    "inline-flex items-center justify-center rounded-md px-2 py-1",
                    TRN_FIELD_CONTROL_TRIGGER_BASE_CLASS,
                    TRN_FIELD_CONTROL_FIELD_VARIANT_CLASS,
                    live.binding != null ? "text-cyan-400/90" : "text-zinc-400",
                  )}
                  aria-label="Open parameter mapping"
                  onClick={openDialog}
                >
                  <Link2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              }
            />
          </div>
        </TRNFormField>

        {includeDisplayUnitFields && showDisplayUnit ? (
          <CourseBindingDisplayUnitFields
            binding={binding}
            idPrefix={fieldId}
            catalogUnit={catalogUnit}
            onPatch={(patch) => {
              if (binding == null) {
                return;
              }
              onChange({ ...binding, ...patch });
            }}
          />
        ) : null}
      </div>

      <CourseParameterMappingDialog
        open={dialogOpen}
        fieldLabel={label}
        draft={binding ?? null}
        valueKind={valueKind}
        staleMs={staleMs}
        onOpenChange={setDialogOpen}
        onApply={onChange}
      />
    </>
  );
}
