import { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNInput } from "../../../ui/TRN/TRNInput";
import {
  COURSE_BINDING_SENSOR_TABS,
  DIAGRAM_BINDING_CATALOG,
  catalogCategoriesForSensor,
  catalogSensorForPath,
  type DiagramBindingSensorId,
} from "../../runtime/diagram/diagramBindingCatalog";

export function CourseBindingCatalogPicker({
  selectedPath,
  valueKind,
  onSelectPath,
}: {
  selectedPath: string | null;
  valueKind?: "number" | "boolean";
  onSelectPath: (path: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeSensor, setActiveSensor] = useState<DiagramBindingSensorId>(() =>
    catalogSensorForPath(selectedPath),
  );
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    setActiveSensor(catalogSensorForPath(selectedPath));
  }, [selectedPath]);

  const categories = useMemo(
    () => catalogCategoriesForSensor(activeSensor, valueKind),
    [activeSensor, valueKind],
  );

  useEffect(() => {
    if (activeCategory === "all") {
      return;
    }
    if (!categories.includes(activeCategory)) {
      setActiveCategory("all");
    }
  }, [activeCategory, categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DIAGRAM_BINDING_CATALOG.filter((entry) => {
      if (entry.sensor !== activeSensor) {
        return false;
      }
      if (valueKind != null && entry.valueKind !== valueKind) {
        return false;
      }
      if (activeCategory !== "all" && entry.category !== activeCategory) {
        return false;
      }
      if (q.length === 0) {
        return true;
      }
      return (
        entry.id.toLowerCase().includes(q) ||
        entry.label.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q) ||
        entry.group.toLowerCase().includes(q)
      );
    });
  }, [query, activeSensor, activeCategory, valueKind]);

  const activeTab = COURSE_BINDING_SENSOR_TABS.find((tab) => tab.id === activeSensor);

  return (
    <div className="flex min-h-0 flex-col gap-2.5">
      <TRNInput
        variant="outlined"
        size="sm"
        className="w-full"
        value={query}
        placeholder="Search label or path…"
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search binding paths"
      />

      <div
        className="flex flex-wrap gap-1"
        role="tablist"
        aria-label="Sensor family"
      >
        {COURSE_BINDING_SENSOR_TABS.map((tab) => {
          const selected = activeSensor === tab.id;
          return (
            <TRNButton
              key={tab.id}
              size="compact"
              selected={selected}
              className="min-w-0 px-2"
              aria-label={`${tab.label} parameters`}
              onClick={() => {
                setActiveSensor(tab.id);
                setActiveCategory("all");
              }}
            >
              {tab.label}
            </TRNButton>
          );
        })}
      </div>

      {activeTab != null ? (
        <p className="text-[10px] leading-relaxed text-zinc-500">{activeTab.subtitle}</p>
      ) : null}

      {categories.length > 1 ? (
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Parameter category">
          <TRNButton
            size="compact"
            selected={activeCategory === "all"}
            className="px-2"
            onClick={() => setActiveCategory("all")}
          >
            All
          </TRNButton>
          {categories.map((category) => (
            <TRNButton
              key={category}
              size="compact"
              selected={activeCategory === category}
              className="px-2"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </TRNButton>
          ))}
        </div>
      ) : null}

      <div
        className="max-h-56 overflow-y-auto rounded-md border border-zinc-700/80 bg-zinc-950/40 scrollbar-hide"
        role="radiogroup"
        aria-label={`${activeSensor} parameters`}
      >
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-[11px] text-zinc-500">
            No parameters match this filter.
          </div>
        ) : (
          filtered.map((entry) => {
            const selected = selectedPath === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelectPath(entry.id)}
                className={twMerge(
                  "flex w-full flex-col gap-0.5 border-b border-zinc-800/60 px-3 py-2 text-left transition-colors last:border-b-0",
                  selected
                    ? "bg-sky-500/10 ring-1 ring-inset ring-sky-500/35"
                    : "hover:bg-zinc-800/50",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={twMerge(
                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                      selected ? "border-sky-400 bg-sky-500/30" : "border-zinc-600",
                    )}
                    aria-hidden
                  >
                    {selected ? <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-zinc-100">
                    {entry.label}
                  </span>
                  {entry.unit != null ? (
                    <span className="shrink-0 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {entry.unit}
                    </span>
                  ) : null}
                </div>
                <div className="pl-5 text-[10px] text-zinc-500">{entry.id}</div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
