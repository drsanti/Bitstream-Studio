import React from "react";
import { Terminal, ExternalLink } from "lucide-react";
import { Card } from "./Card";

export interface BridgeRequiredEmptyStateProps {
  title: string;
  details?: string;
  wsUrl?: string;
  /** Suggested command(s) to run in a terminal. */
  commands?: string[];
  /** Optional hint for using the VS Code extension instead. */
  extensionHint?: string;
}

export function BridgeRequiredEmptyState({
  title,
  details,
  wsUrl,
  commands,
  extensionHint,
}: BridgeRequiredEmptyStateProps) {
  return (
    <Card className="border border-white/10 bg-white/5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-black/30 p-2 text-white/80">
          <Terminal className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold text-white/90">{title}</div>
          {details ? (
            <div className="mt-1 text-sm text-white/70">{details}</div>
          ) : null}

          {wsUrl ? (
            <div className="mt-2 text-xs text-white/60">
              Bridge endpoint: <span className="font-mono">{wsUrl}</span>
            </div>
          ) : null}

          {commands && commands.length > 0 ? (
            <div className="mt-3 space-y-2">
              {commands.map((cmd) => (
                <div
                  key={cmd}
                  className="rounded-md border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-white/80"
                >
                  {cmd}
                </div>
              ))}
            </div>
          ) : null}

          {extensionHint ? (
            <div className="mt-3 flex items-start gap-2 text-sm text-white/70">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
              <div className="min-w-0">{extensionHint}</div>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

