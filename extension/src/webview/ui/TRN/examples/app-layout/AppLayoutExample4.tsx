import type { AppLayoutExampleProps } from "./types.js";
import { TRNSectionContainer } from "../../TRNSectionContainer.js";

export function AppLayoutExample4(props: AppLayoutExampleProps) {
  return (
    <div className="h-full min-h-0 grid grid-cols-[72px_1fr] gap-2">
      <TRNSectionContainer title="Rail">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-10 rounded border border-zinc-700/80 bg-zinc-800/70"
            />
          ))}
        </div>
      </TRNSectionContainer>
      <TRNSectionContainer title="Focus Content" className="overflow-y-auto">
        {props.content}
      </TRNSectionContainer>
    </div>
  );
}
