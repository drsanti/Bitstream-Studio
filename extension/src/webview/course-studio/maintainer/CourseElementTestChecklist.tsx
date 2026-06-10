import { Check } from "lucide-react";
import { TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import type { PageBlockV1 } from "../schemas/page.v1";
import { PAGE_BLOCK_PALETTE } from "./blockFactory";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { COURSE_WORKBENCH_PANE_LABELS } from "../workbench/course-workbench-pane-labels";

const ELEMENT_TEST_ORDER: ReadonlyArray<{
  kind: PageBlockV1["kind"];
  note: string;
}> = [
  { kind: "heading", note: "Title row — edit eyebrow, title, subtitle in the block Properties pane." },
  { kind: "callout-info", note: "Admonition — try info / warning / danger / tip variants." },
  { kind: "markdown", note: "Inline markdown, bundled .theory.md, or remote URL (GitHub README)." },
  { kind: "card", note: "Simple card copy block." },
  { kind: "live-metric", note: "Live tri-axis widget — needs Bitstream or Simulator route." },
  { kind: "dashboard-widget", note: "Gauge / bar / numeric / LED / status — map binding; Bitstream or Simulator route." },
  { kind: "sensor-telemetry-card", note: "One Sensor Telemetry card (Euler, pressure, gyro, …) — same rows, badge, and settings as Telemetry Data." },
  { kind: "diagram-2d", note: `Blank diagram in ${COURSE_WORKBENCH_PANE_LABELS.diagram} — or Quick add Live PCB for 3D Scene design editor.` },
  { kind: "scene-3d", note: "Editable scene document — 3D Scene Editor workbench + Inspector." },
  { kind: "image", note: "Image URL with optional alt text and caption." },
  { kind: "code", note: "Code snippet with language label." },
  { kind: "youtube", note: "YouTube embed — playback + player options in block inspector." },
  { kind: "iframe", note: "External page in a sandboxed iframe." },
];

function pageHasBlockKind(blocks: PageBlockV1[], kind: PageBlockV1["kind"]): boolean {
  if (kind === "callout-info") {
    return blocks.some((block) => block.kind.startsWith("callout-"));
  }
  return blocks.some((block) => block.kind === kind);
}

export function CourseElementTestChecklist({ bare = false }: { bare?: boolean }) {
  const page = useCoursePageEditorStore((s) => s.page);

  if (page == null || !import.meta.env.DEV) {
    return null;
  }

  const testedCount = ELEMENT_TEST_ORDER.filter((entry) =>
    pageHasBlockKind(page.blocks, entry.kind),
  ).length;

  const paletteLabel = (kind: PageBlockV1["kind"]) =>
    PAGE_BLOCK_PALETTE.find((entry) => entry.kind === kind)?.label ?? kind;

  const body = (
    <>
      <TRNHintText>
        Add and verify each block type in order ({testedCount}/{ELEMENT_TEST_ORDER.length}{" "}
        present on page).
      </TRNHintText>
      <ol className="mt-2 space-y-2">
        {ELEMENT_TEST_ORDER.map((entry, index) => {
          const done = pageHasBlockKind(page.blocks, entry.kind);
          return (
            <li
              key={entry.kind}
              className={`flex gap-2 rounded-md border px-2.5 py-2 ${
                done
                  ? "border-emerald-500/35 bg-emerald-500/10"
                  : "border-[var(--surface-border)] bg-[var(--surface-card)]/50"
              }`}
            >
              <span
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold leading-none ${
                  done
                    ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
                    : "border-[var(--surface-border)] text-[var(--text-muted)]"
                }`}
                aria-hidden
              >
                {done ? <Check size={10} strokeWidth={3} /> : index + 1}
              </span>
              <div className="min-w-0 text-left">
                <div className="text-[11px] font-semibold leading-snug text-[var(--text-primary)]">
                  {paletteLabel(entry.kind)}
                </div>
                <div className="text-[10px] leading-snug text-[var(--text-muted)]">{entry.note}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );

  if (bare) {
    return body;
  }

  return <TRNFormSection title="Element test checklist">{body}</TRNFormSection>;
}
