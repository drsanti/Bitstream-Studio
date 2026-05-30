import type { AppLayoutExampleProps } from "./types.js";
import { TRNSectionContainer } from "../../TRNSectionContainer.js";

export function AppLayoutExample5(props: AppLayoutExampleProps) {
  return (
    <div className="h-full min-h-0 grid grid-cols-12 gap-2">
      <TRNSectionContainer title="Stats" className="col-span-3 overflow-y-auto">
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div
              key={idx}
              className="h-12 rounded border border-zinc-700/80 bg-zinc-800/70"
            />
          ))}
        </div>
      </TRNSectionContainer>
      <TRNSectionContainer title="Main Board" className="col-span-6 overflow-y-auto">
        {props.content}
      </TRNSectionContainer>
      <TRNSectionContainer title="Inspector" className="col-span-3 overflow-y-auto">
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="h-8 rounded border border-zinc-700/80 bg-zinc-800/70"
            />
          ))}
        </div>
      </TRNSectionContainer>
    </div>
  );
}
