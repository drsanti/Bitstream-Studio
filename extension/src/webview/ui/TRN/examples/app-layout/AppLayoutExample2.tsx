import type { AppLayoutExampleProps } from "./types.js";
import { TRNSectionContainer } from "../../TRNSectionContainer.js";

export function AppLayoutExample2(props: AppLayoutExampleProps) {
  return (
    <div className="h-full min-h-0 grid grid-cols-[220px_1fr] gap-2">
      <TRNSectionContainer title="Sidebar" className="overflow-y-auto">
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="h-8 rounded border border-zinc-700/80 bg-zinc-800/70"
            />
          ))}
        </div>
      </TRNSectionContainer>
      <div className="min-h-0 grid grid-rows-[auto_1fr] gap-2">
        <TRNSectionContainer title="Toolbar">
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 rounded border border-zinc-700/80 bg-zinc-800/70" />
            <div className="h-8 rounded border border-zinc-700/80 bg-zinc-800/70" />
            <div className="h-8 rounded border border-zinc-700/80 bg-zinc-800/70" />
          </div>
        </TRNSectionContainer>
        <TRNSectionContainer title="Workbench" className="overflow-y-auto">
          {props.content}
        </TRNSectionContainer>
      </div>
    </div>
  );
}
