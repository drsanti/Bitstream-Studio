import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../../TRNTabs.js";
import { AppLayoutExample1 } from "./AppLayoutExample1.js";
import { AppLayoutExample2 } from "./AppLayoutExample2.js";
import { AppLayoutExample3 } from "./AppLayoutExample3.js";
import { AppLayoutExample4 } from "./AppLayoutExample4.js";
import { AppLayoutExample5 } from "./AppLayoutExample5.js";
import { AppLayoutExample6 } from "./AppLayoutExample6.js";
import { AppLayoutExample7 } from "./AppLayoutExample7.js";

type LayoutId =
  | "stack-default"
  | "workbench-sidebar"
  | "split-console"
  | "focus-rail"
  | "monitor-wall"
  | "dense-dual"
  | "mobile-first";

type AppLayoutExamplesProps = {
  content: ReactNode;
  defaultLayout?: LayoutId;
};

const LAYOUT_TABS: ReadonlyArray<{ id: LayoutId; label: string }> = [
  { id: "stack-default", label: "Stack Default" },
  { id: "workbench-sidebar", label: "Workbench Sidebar" },
  { id: "split-console", label: "Split Console" },
  { id: "focus-rail", label: "Focus Rail" },
  { id: "monitor-wall", label: "Monitor Wall" },
  { id: "dense-dual", label: "Dense Dual" },
  { id: "mobile-first", label: "Mobile First" },
];

export function AppLayoutExamples(props: AppLayoutExamplesProps) {
  const [activeLayout, setActiveLayout] = useState<LayoutId>(
    props.defaultLayout ?? "stack-default"
  );
  useEffect(() => {
    if (props.defaultLayout != null) {
      setActiveLayout(props.defaultLayout);
    }
  }, [props.defaultLayout]);

  const content = useMemo(() => {
    if (activeLayout === "stack-default") {
      return <AppLayoutExample1 content={props.content} />;
    }
    if (activeLayout === "workbench-sidebar") {
      return <AppLayoutExample2 content={props.content} />;
    }
    if (activeLayout === "split-console") {
      return <AppLayoutExample3 content={props.content} />;
    }
    if (activeLayout === "focus-rail") {
      return <AppLayoutExample4 content={props.content} />;
    }
    if (activeLayout === "monitor-wall") {
      return <AppLayoutExample5 content={props.content} />;
    }
    if (activeLayout === "dense-dual") {
      return <AppLayoutExample6 content={props.content} />;
    }
    return <AppLayoutExample7 content={props.content} />;
  }, [activeLayout, props.content]);

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-2">
        <div className="text-[11px] text-zinc-400 mb-2">
          App layout exploration (7 variants) — switch and inspect.
        </div>
        <TRNTabs value={activeLayout} onValueChange={(next) => setActiveLayout(next as LayoutId)}>
          <TRNTabsList className="flex flex-wrap">
            {LAYOUT_TABS.map((tab) => (
              <TRNTabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TRNTabsTrigger>
            ))}
          </TRNTabsList>
        </TRNTabs>
      </div>
      <div className="min-h-0 flex-1">{content}</div>
    </div>
  );
}
