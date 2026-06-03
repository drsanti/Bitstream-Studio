import type { ReactNode } from "react";
import { Terminal } from "lucide-react";
import { ModelLoaderGroupCard } from "../ui/catalog/ModelLoaderGroupCard.js";
import { TRNHintText } from "../ui/TRN/TRNHintText.js";

/** Browser dev only — bridge setup (collapsed at bottom of Free Loader). */
export function FreeAssetsLoaderBridgeDevFooter(props: {
  wsUrl: string;
  commands: string[];
  extensionHint: string;
}): ReactNode {
  const { wsUrl, commands, extensionHint } = props;

  return (
    <ModelLoaderGroupCard
      title="Development — bridge connection"
      defaultOpen={false}
      className="border-zinc-700/70 bg-zinc-900/45 shadow-none ring-0"
      contentClassName="space-y-2.5"
    >
      <div className="flex items-start gap-2">
        <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/80" aria-hidden />
        <div className="min-w-0 space-y-2">
          <TRNHintText tone="warn">
            TERNION pack sync in browser mode needs the model-loader WebSocket bridge. Start it,
            then reload this page.
          </TRNHintText>
          <p className="text-[11px] text-zinc-400">
            Endpoint: <span className="break-all text-zinc-200">{wsUrl}</span>
          </p>
          {commands.length > 0 ? (
            <ul className="space-y-1.5">
              {commands.map((cmd) => (
                <li
                  key={cmd}
                  className="rounded border border-zinc-700/80 bg-zinc-950/60 px-2.5 py-1.5 text-[11px] leading-snug text-zinc-200"
                >
                  {cmd}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-[11px] leading-relaxed text-zinc-500">{extensionHint}</p>
        </div>
      </div>
    </ModelLoaderGroupCard>
  );
}
