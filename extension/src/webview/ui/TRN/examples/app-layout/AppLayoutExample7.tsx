import type { AppLayoutExampleProps } from "./types.js";
import { TRNSectionContainer } from "../../TRNSectionContainer.js";

export function AppLayoutExample7(props: AppLayoutExampleProps) {
  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_1fr_auto] gap-2">
      <TRNSectionContainer title="Mobile Header">
        <div className="h-9 rounded border border-zinc-700/80 bg-zinc-800/70" />
      </TRNSectionContainer>
      <TRNSectionContainer title="Scrollable Main" className="overflow-y-auto">
        {props.content}
      </TRNSectionContainer>
      <TRNSectionContainer title="Bottom Actions">
        <div className="grid grid-cols-3 gap-2">
          <div className="h-8 rounded border border-zinc-700/80 bg-zinc-800/70" />
          <div className="h-8 rounded border border-zinc-700/80 bg-zinc-800/70" />
          <div className="h-8 rounded border border-zinc-700/80 bg-zinc-800/70" />
        </div>
      </TRNSectionContainer>
    </div>
  );
}
