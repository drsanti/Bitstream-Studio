import { useMemo } from "react";
import { Copy, RefreshCw } from "lucide-react";
import {
  TRNButton,
  TRNDataGrid,
  TRNHintText,
  TRNIconButton,
  TRNInteractiveCard,
  type TRNDataGridColumn,
} from "../../../ui/TRN";
import { writeClipboardText } from "../../../ui/utils/clipboard.js";
import { useAssetRuntimeConfig } from "../../hooks/useAssetRuntimeConfig.js";
import type { InjectedAssetBasesSnapshot } from "../../hooks/useInjectedAssetBases.js";

type BaseRow = {
  id: string;
  label: string;
  value: string;
};

function snapshotToRows(s: InjectedAssetBasesSnapshot): BaseRow[] {
  return [
    { id: "local", label: "LOCAL (bundled webview assets)", value: s.local || "—" },
    { id: "free", label: "FREE (per-user mirror)", value: s.free || "—" },
    {
      id: "tesaiot-tex",
      label: "TESAIOT_TEXTURES (per-user pack)",
      value: s.tesaiotTextures || "—",
    },
    { id: "online", label: "ONLINE (catalog / remote)", value: s.online || "—" },
    {
      id: "current",
      label: "Host default online base",
      value: s.currentBaseUrl || "—",
    },
  ];
}

/**
 * Runtime tab: injected base URIs used by `resolveWebviewModelAssetUrl` and related loaders.
 */
export function GlobalDirectoriesRuntimeTab() {
  const {
    isExtensionHost,
    snapshot,
    refreshing,
    lastHostRefreshAt,
    statusMessage,
    refreshFromHost,
    strategy,
  } = useAssetRuntimeConfig();

  const rows = useMemo(() => snapshotToRows(snapshot), [snapshot]);

  const columns = useMemo((): TRNDataGridColumn<BaseRow>[] => {
    return [
      { id: "label", label: "Base", width: 200, getValue: (r) => r.label },
      {
        id: "value",
        label: "URI",
        width: 280,
        sortable: false,
        getValue: (r) => r.value,
        cell: (r) => (
          <span className="block max-w-[280px] truncate font-mono text-[10px] text-zinc-400">
            {r.value}
          </span>
        ),
      },
      {
        id: "copy",
        label: "",
        width: 40,
        sortable: false,
        getValue: () => "",
        cell: (r) => (
          <TRNIconButton
            type="button"
            label="Copy URI"
            disabled={!r.value || r.value === "—"}
            icon={<Copy className="h-3.5 w-3.5" aria-hidden />}
            onClick={() => {
              if (r.value && r.value !== "—") {
                void writeClipboardText(r.value);
              }
            }}
          />
        ),
      },
    ];
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-2">
        <TRNHintText tone="muted" className="mb-0 min-w-0 flex-1 text-[10px] leading-snug">
          These URIs are what the webview uses when resolving relative asset paths (see{" "}
          <span className="font-mono text-zinc-500">resolveWebviewModelAssetUrl</span>).{" "}
          {isExtensionHost
            ? "Refresh pulls fresh asWebviewUri values and the online base from the extension host."
            : "In browser dev, values come from main / Vite; refresh is only available in the editor webview."}
        </TRNHintText>
        {isExtensionHost ? (
          <TRNButton
            type="button"
            size="compact"
            className="shrink-0 gap-1"
            disabled={refreshing}
            onClick={() => refreshFromHost()}
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            Refresh bases
          </TRNButton>
        ) : null}
      </div>

      {statusMessage ? (
        <TRNHintText tone="info" className="mb-0 text-[10px]">
          {statusMessage}
        </TRNHintText>
      ) : null}

      {lastHostRefreshAt ? (
        <TRNHintText tone="muted" className="mb-0 text-[10px]">
          Last host refresh:{" "}
          <span className="font-mono text-zinc-500">{lastHostRefreshAt}</span>
        </TRNHintText>
      ) : null}

      <TRNInteractiveCard
        collapsible={false}
        title="Injected bases"
        contentClassName="space-y-2 pt-0"
      >
        <TRNDataGrid<BaseRow>
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          stickyHeader
        />
      </TRNInteractiveCard>

      <TRNInteractiveCard
        collapsible={false}
        title="Asset source strategy"
        contentClassName="space-y-1.5 pt-0 text-[11px] leading-relaxed text-zinc-400"
      >
        <p className="mb-0">
          Effective strategy:{" "}
          <span className="font-mono font-medium text-cyan-300/90">{strategy}</span>
        </p>
        <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
          Injected from the host as <span className="font-mono">ASSET_SOURCE_STRATEGY</span> when
          the panel loads; <span className="font-mono">localStorage</span> key{" "}
          <span className="font-mono text-zinc-500">ternion.assetSourceStrategy</span> can override
          in browser builds. Changing strategy requires reload or a future live control.
        </TRNHintText>
      </TRNInteractiveCard>
    </div>
  );
}
