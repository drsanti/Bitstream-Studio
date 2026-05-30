import type { AppLayoutExampleProps } from "./types.js";
import { TRNSectionContainer } from "../../TRNSectionContainer.js";

export function AppLayoutExample3(props: AppLayoutExampleProps) {
  return (
    <div className="h-full min-h-0 grid grid-rows-[1fr_220px] gap-2">
      <TRNSectionContainer title="Main" className="overflow-y-auto">
        {props.content}
      </TRNSectionContainer>
      <TRNSectionContainer title="Console / Logs" className="overflow-y-auto">
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-5 rounded border border-zinc-700/80 bg-zinc-800/70"
            />
          ))}
        </div>
      </TRNSectionContainer>
    </div>
  );
}
