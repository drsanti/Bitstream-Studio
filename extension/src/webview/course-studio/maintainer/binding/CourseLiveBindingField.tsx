import { Link2 } from "lucide-react";
import { useId, useState } from "react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import type { DiagramBindingV1 } from "../../schemas/diagram.v1";
import { catalogEntryForPath } from "../../runtime/diagram/diagramBindingCatalog";
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
}: {
  label: string;
  binding: DiagramBindingV1 | null | undefined;
  valueKind?: "number" | "boolean";
  staleMs?: number;
  onChange: (next: DiagramBindingV1 | null) => void;
  hint?: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const fieldId = useId();
  const live = useCourseLiveBinding(binding, staleMs);

  const summaryPath = live.binding?.path ?? "Not mapped";
  const summaryValue =
    live.binding != null
      ? live.unit.length > 0
        ? `${live.displayText} ${live.unit}`
        : live.displayText
      : "Click to bind live data";

  const openDialog = () => setDialogOpen(true);
  const catalogUnit =
    binding?.path != null ? catalogEntryForPath(binding.path)?.unit : undefined;
  const showDisplayUnit =
    valueKind === "number" && binding?.path != null && binding.path.length > 0;

  return (
    <>
      <div className="flex flex-col gap-2">
        <TRNFormField id={fieldId} label={label} hint={hint}>
          <div className="flex items-stretch gap-1">
            <button
              type="button"
              className={twMerge(
                "flex min-w-0 flex-1 flex-col gap-0.5 rounded-md border px-2 py-1.5 text-left transition-colors",
                live.binding != null
                  ? "border-zinc-700/80 bg-zinc-950/50 hover:border-zinc-600/80"
                  : "border-dashed border-zinc-700/60 bg-zinc-950/30 hover:border-zinc-600/70",
              )}
              onClick={openDialog}
              aria-label={`Map ${label} to live data`}
            >
              <CourseBindingPreviewStrip
                compact
                pathLabel={summaryPath}
                displayText={summaryValue}
                unit=""
                health={live.health}
              />
            </button>
            <div className="flex shrink-0 self-stretch">
              <TRNButton
                size="compact"
                hint="Open parameter mapping"
                hintPlacement="left"
                className={twMerge(
                  "h-full self-stretch px-2",
                  live.binding != null && "text-cyan-400/90",
                )}
                aria-label={`Map ${label} to live data`}
                onClick={openDialog}
              >
                <Link2 className="h-3.5 w-3.5" aria-hidden />
              </TRNButton>
            </div>
          </div>
        </TRNFormField>

        {showDisplayUnit ? (
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
