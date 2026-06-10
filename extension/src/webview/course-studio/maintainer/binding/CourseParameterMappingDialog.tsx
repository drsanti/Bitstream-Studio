import { Cable, GitCompareArrows, SlidersHorizontal } from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import { TRNWindow, type TRNWindowRect } from "../../../ui/TRN/TRNWindow";
import type { DiagramBindingV1 } from "../../schemas/diagram.v1";
import { bindingForCatalogPath, catalogEntryForPath } from "../../runtime/diagram/diagramBindingCatalog";
import { CourseBindingDisplayUnitFields } from "./CourseBindingDisplayUnitFields";
import { useCourseLiveBinding } from "../../runtime/useCourseLiveBinding";
import { CourseMaintainerScrubNumberInput } from "../CourseMaintainerScrubNumberInput";
import { CourseBindingCatalogPicker } from "./CourseBindingCatalogPicker";
import { CourseBindingMapTransformFields } from "./CourseBindingMapTransformFields";
import { CourseBindingPreviewStrip } from "./CourseBindingPreviewStrip";
import { CourseInspectorCard } from "../CourseInspectorCard";

const DIALOG_HEIGHT_PX = 680;
const DIALOG_WIDTH_PX = 560;

function computeCenteredRect(): Partial<TRNWindowRect> {
  if (typeof window === "undefined") {
    return { x: 100, y: 64, width: DIALOG_WIDTH_PX, height: DIALOG_HEIGHT_PX };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(DIALOG_WIDTH_PX, Math.max(360, vw - 40));
  const height = Math.min(DIALOG_HEIGHT_PX, Math.max(420, vh - 40));
  return {
    x: Math.max(12, (vw - width) / 2),
    y: Math.max(12, (vh - height) / 2),
    width,
    height,
  };
}

const DECIMAL_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "4", label: "4" },
] as const;

function decimalsToFormat(value: string): string | undefined {
  if (value === "auto") {
    return undefined;
  }
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) {
    return undefined;
  }
  return `0.${"0".repeat(n)}f`;
}

function formatToDecimals(format: string | undefined): string {
  if (format == null) {
    return "auto";
  }
  const match = format.match(/^0\.(\d+)f?$/);
  if (match == null) {
    return "auto";
  }
  return String(match[1].length);
}

export function CourseParameterMappingDialog({
  open,
  fieldLabel,
  draft,
  valueKind = "number",
  staleMs,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  fieldLabel: string;
  draft: DiagramBindingV1 | null;
  valueKind?: "number" | "boolean";
  staleMs?: number;
  onOpenChange: (open: boolean) => void;
  onApply: (next: DiagramBindingV1 | null) => void;
}) {
  const [initialRect, setInitialRect] = useState<Partial<TRNWindowRect>>(() => computeCenteredRect());
  const [local, setLocal] = useState<DiagramBindingV1 | null>(draft);
  const [displayCollapsed, setDisplayCollapsed] = useState(true);
  const [mapCollapsed, setMapCollapsed] = useState(true);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    setLocal(draft);
    setInitialRect(computeCenteredRect());
    setDisplayCollapsed(true);
    setMapCollapsed(true);
  }, [open, draft]);

  const preview = useCourseLiveBinding(local, staleMs);

  const decimalSelect = useMemo(
    () => formatToDecimals(local?.format),
    [local?.format],
  );

  const catalog = local?.path != null ? catalogEntryForPath(local.path) : undefined;

  const rawNumber =
    typeof preview.rawValue === "number" && Number.isFinite(preview.rawValue)
      ? preview.rawValue
      : null;

  return (
    <TRNWindow
      open={open}
      title={`Parameter mapping — ${fieldLabel}`}
      prefixIcon={<Cable className="h-4 w-4 text-cyan-400/90" strokeWidth={2.25} aria-hidden />}
      onClose={() => onOpenChange(false)}
      initialRect={initialRect}
      minWidth={360}
      minHeight={420}
      modal
      modalBackdropCloses={false}
      draggable={false}
      resizable={false}
      showMaximize={false}
      showFooter={false}
      heightMode="fixed"
      glass
      glassPreset="medium"
      zIndex={72}
      contentClassName="min-h-0 overflow-y-auto"
    >
      <div className="flex min-h-0 flex-col gap-3 p-1">
        <CourseBindingPreviewStrip
          pathLabel={preview.pathLabel}
          displayText={preview.displayText}
          unit={preview.unit}
          health={preview.health}
        />

        <section className="flex min-h-0 flex-col gap-2 rounded-md border border-zinc-700/80 bg-zinc-950/30 p-2.5">
          <div className="flex items-center gap-2">
            <Cable className="h-3.5 w-3.5 shrink-0 text-cyan-400/80" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-zinc-200">Source parameter</div>
              <div className="text-[10px] text-zinc-500">
                Pick a sensor tab, filter by category, then select a live path.
              </div>
            </div>
          </div>
          <CourseBindingCatalogPicker
            selectedPath={local?.path ?? null}
            valueKind={valueKind}
            onSelectPath={(path) => {
              setLocal((prev) => bindingForCatalogPath(path, prev));
            }}
          />
        </section>

        <CourseInspectorCard
          title="Display & fallback"
          titleIcon={<SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
          defaultCollapsed={displayCollapsed}
          onCollapsedChange={setDisplayCollapsed}
        >
          <div className="flex flex-col gap-2">
            <TRNFormField id="binding-fallback" label="Fallback">
              <CourseMaintainerScrubNumberInput
                value={typeof local?.fallback === "number" ? local.fallback : 0}
                step={0.1}
                onChange={(fallback) =>
                  setLocal((prev) =>
                    prev != null ? { ...prev, fallback } : { path: "", fallback },
                  )
                }
              />
            </TRNFormField>
            {valueKind === "number" ? (
              <>
                <CourseBindingDisplayUnitFields
                  binding={local}
                  idPrefix="binding"
                  catalogUnit={catalog?.unit}
                  onPatch={(patch) =>
                    setLocal((prev) =>
                      prev != null ? { ...prev, ...patch } : { path: "", ...patch },
                    )
                  }
                />
                <TRNFormField id="binding-decimals" label="Decimals">
                  <TRNSelect
                    value={decimalSelect}
                    ariaLabel="Binding decimal places"
                    options={DECIMAL_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    onValueChange={(value) => {
                      const format = decimalsToFormat(value);
                      setLocal((prev) =>
                        prev != null ? { ...prev, format } : { path: "", format },
                      );
                    }}
                  />
                </TRNFormField>
              </>
            ) : null}
          </div>
        </CourseInspectorCard>

        {valueKind === "number" ? (
          <CourseInspectorCard
            title="Map & transform"
            hint="Remap sensor values before display"
            titleIcon={<GitCompareArrows className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
            defaultCollapsed={mapCollapsed}
            onCollapsedChange={setMapCollapsed}
          >
            {local != null && local.path.length > 0 ? (
              <CourseBindingMapTransformFields
                idPrefix="course-binding-map"
                binding={local}
                onChange={setLocal}
                rawValue={rawNumber}
                displayValue={preview.displayValue}
                unit={preview.unit}
                format={local.format}
              />
            ) : (
              <TRNHintText tone="muted">Pick a source parameter above to configure transforms.</TRNHintText>
            )}
          </CourseInspectorCard>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-3">
          <TRNButton
            size="compact"
            onClick={() => {
              onApply(null);
              onOpenChange(false);
            }}
          >
            Clear binding
          </TRNButton>
          <div className="flex gap-2">
            <TRNButton size="compact" onClick={() => onOpenChange(false)}>
              Cancel
            </TRNButton>
            <TRNButton
              size="compact"
              selected
              disabled={local?.path == null || local.path.length === 0}
              onClick={() => {
                if (local?.path == null || local.path.length === 0) {
                  return;
                }
                onApply(local);
                onOpenChange(false);
              }}
            >
              Apply
            </TRNButton>
          </div>
        </div>
      </div>
    </TRNWindow>
  );
}
