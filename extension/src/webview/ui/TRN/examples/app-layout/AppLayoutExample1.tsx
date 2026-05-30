import type { AppLayoutExampleProps } from "./types.js";
import { TRNSectionContainer } from "../../TRNSectionContainer.js";

export function AppLayoutExample1(props: AppLayoutExampleProps) {
  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_auto_1fr] gap-2">
      <TRNSectionContainer title="Top Header">
        <div className="h-8 rounded border border-zinc-700/80 bg-zinc-800/70" />
      </TRNSectionContainer>
      <TRNSectionContainer title="Quick Actions">
        <div className="grid grid-cols-4 gap-2">
          <div className="h-7 rounded border border-zinc-700/80 bg-zinc-800/70" />
          <div className="h-7 rounded border border-zinc-700/80 bg-zinc-800/70" />
          <div className="h-7 rounded border border-zinc-700/80 bg-zinc-800/70" />
          <div className="h-7 rounded border border-zinc-700/80 bg-zinc-800/70" />
        </div>
      </TRNSectionContainer>
      <TRNSectionContainer title="Main Content" className="overflow-y-auto">
        {props.content}
      </TRNSectionContainer>
    </div>
  );
}
