import type { AppLayoutExampleProps } from "./types.js";
import { TRNSectionContainer } from "../../TRNSectionContainer.js";

export function AppLayoutExample6(props: AppLayoutExampleProps) {
  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_1fr] gap-2">
      <TRNSectionContainer title="Dense Control Strip">
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-7 rounded border border-zinc-700/80 bg-zinc-800/70"
            />
          ))}
        </div>
      </TRNSectionContainer>
      <div className="min-h-0 grid grid-cols-2 gap-2">
        <TRNSectionContainer title="Primary" className="overflow-y-auto">
          {props.content}
        </TRNSectionContainer>
        <TRNSectionContainer title="Secondary" className="overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="h-20 rounded border border-zinc-700/80 bg-zinc-800/70"
              />
            ))}
          </div>
        </TRNSectionContainer>
      </div>
    </div>
  );
}
