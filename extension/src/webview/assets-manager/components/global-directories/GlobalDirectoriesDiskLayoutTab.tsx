import { useCallback, useMemo, useState } from "react";
import { Copy, FolderOpen, RefreshCw } from "lucide-react";
import {
  DEV_SRC_ASSETS_PREFIX,
  DEV_SRC_ASSET_DIRS,
  FREE_MODELS_WEB_PREFIX,
  TESAIOT_MODELS_WEB_PREFIX,
  TESAIOT_TEXTURES_WEB_PREFIX,
} from "../../../../assetLayout.js";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
  TRNButton,
  TRNDataGrid,
  TRNHintText,
  TRNIconButton,
  type TRNDataGridColumn,
} from "../../../ui/TRN";
import { ternionFreeAssetPackCopy } from "../../../asset-bootstrap/ternionFreeAssetPackCopy.js";
import { writeClipboardText } from "../../../ui/utils/clipboard.js";
import { useExtensionDefaultDownloadPaths } from "../../hooks/useExtensionDefaultDownloadPaths.js";

type PerUserDiskRow = {
  id: string;
  role: string;
  segment: string;
  webPrefix: string;
  /** Absolute folder when the host provided it */
  absoluteFs?: string;
};

type RepoDiskRow = {
  id: string;
  area: string;
  pathPattern: string;
  notes: string;
};

type BridgeDiskRow = {
  id: string;
  role: string;
  path: string;
  notes: string;
};

/** Human-readable join of globalStorage asset dir segments (no path API in webview). */
const GLOBAL_STORAGE_SEGMENTS = {
  tesaiotModels: "tesaiot/models/",
  tesaiotTextures: "tesaiot/textures/",
  freePack: "free",
} as const;

function buildPerUserRows(
  paths: {
    modelDownloadsRootFs: string;
    freeGithubRootFs: string;
    tesaiotTexturesRootFs: string;
    userAssetsRootFs: string;
  } | null,
): PerUserDiskRow[] {
  return [
    {
      id: "ml",
      role: "Model Loader / catalog",
      segment: GLOBAL_STORAGE_SEGMENTS.tesaiotModels,
      webPrefix: TESAIOT_MODELS_WEB_PREFIX,
      absoluteFs: paths?.modelDownloadsRootFs,
    },
    {
      id: "tesaiot-tx",
      role: "Tesaiot pack (textures)",
      segment: GLOBAL_STORAGE_SEGMENTS.tesaiotTextures,
      webPrefix: TESAIOT_TEXTURES_WEB_PREFIX,
      absoluteFs: paths?.tesaiotTexturesRootFs,
    },
    {
      id: "free",
      role: ternionFreeAssetPackCopy.globalDirsDiskRole,
      segment: `${GLOBAL_STORAGE_SEGMENTS.freePack}/`,
      webPrefix: `${FREE_MODELS_WEB_PREFIX} (models)`,
      absoluteFs: paths?.freeGithubRootFs,
    },
    {
      id: "bucket",
      role: "Per-user assets bucket",
      segment: "assets/",
      webPrefix: "—",
      absoluteFs: paths?.userAssetsRootFs,
    },
  ];
}

const REPO_DISK_ROWS: RepoDiskRow[] = [
  {
    id: "free-m",
    area: "Free pack (dev)",
    pathPattern: `${DEV_SRC_ASSETS_PREFIX}${DEV_SRC_ASSET_DIRS.freeModels.join("/")}/`,
    notes: "Mirrors public repo layout for models.",
  },
  {
    id: "free-t",
    area: "Free pack (dev)",
    pathPattern: `${DEV_SRC_ASSETS_PREFIX}${DEV_SRC_ASSET_DIRS.freeTextures.join("/")}/`,
    notes: "Textures side of the free mirror.",
  },
  {
    id: "tesaiot-m",
    area: "Tesaiot pack (dev)",
    pathPattern: `${DEV_SRC_ASSETS_PREFIX}${DEV_SRC_ASSET_DIRS.tesaiotModels.join("/")}/`,
    notes: "Model Loader / API output; mirrors **globalStorage** `tesaiot/models/`.",
  },
  {
    id: "tesaiot-t",
    area: "Tesaiot pack (dev)",
    pathPattern: `${DEV_SRC_ASSETS_PREFIX}${DEV_SRC_ASSET_DIRS.tesaiotTextures.join("/")}/`,
    notes: "Parallel to **free/textures/** for Tesaiot-side raster assets.",
  },
  {
    id: "models",
    area: "Bundled / mirrored models",
    pathPattern: `${DEV_SRC_ASSETS_PREFIX}models/**`,
    notes: "Catalog-mirrored GLBs; large files may be omitted from VSIX.",
  },
  {
    id: "cubemap",
    area: "Cubemaps",
    pathPattern: `${DEV_SRC_ASSETS_PREFIX}textures/cubemap/...`,
    notes: "Raster faces for previews and Sensor Studio.",
  },
];

const BRIDGE_DISK_ROWS: BridgeDiskRow[] = [
  {
    id: "mono-tesaiot",
    role: "Monorepo Model Loader mirror",
    path: "ternion-t3d/assets/tesaiot/models",
    notes: "When `ternion-t3d/assets` exists next to `t3d-extension`, the bridge prefers this folder for catalog scan and default downloads.",
  },
  {
    id: "dev-out",
    role: "Env override (standalone bridge)",
    path: "TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR / TERNION_BRIDGE_MODEL_DOWNLOADS_OUTPUT_DIR",
    notes: "Required when the monorepo **ternion-t3d/assets** tree is not next to **t3d-extension**; see bridge asset layout errors in the Model Catalog (browser).",
  },
];

/**
 * Disk layout tab: per-user roots from the host when available, plus static repo / bridge reference.
 */
export function GlobalDirectoriesDiskLayoutTab() {
  const { isExtensionHost, paths, loading, refreshPaths, revealAbsolutePath } =
    useExtensionDefaultDownloadPaths();
  const [feedback, setFeedback] = useState<string | null>(null);

  const perUserRows = useMemo(() => buildPerUserRows(paths), [paths]);

  const onReveal = useCallback(
    async (absoluteFs: string) => {
      const result = await revealAbsolutePath(absoluteFs);
      if (result.ok) {
        setFeedback("Opened folder in your file manager.");
      } else {
        setFeedback(result.error);
      }
    },
    [revealAbsolutePath],
  );

  const onCopy = useCallback(async (absoluteFs: string) => {
    const ok = await writeClipboardText(absoluteFs);
    setFeedback(ok ? "Path copied to clipboard." : "Copy failed.");
  }, []);

  const perUserColumns = useMemo((): TRNDataGridColumn<PerUserDiskRow>[] => {
    return [
      { id: "role", label: "Role", width: 128, getValue: (r) => r.role },
      { id: "seg", label: "Subfolder", width: 112, getValue: (r) => r.segment },
      { id: "prefix", label: "Web prefix", width: 120, getValue: (r) => r.webPrefix },
      {
        id: "path",
        label: "On disk",
        width: 160,
        sortable: false,
        getValue: (r) => r.absoluteFs ?? "",
        cell: (r) => (
          <span className="block max-w-[160px] truncate font-mono text-[10px] text-zinc-500">
            {r.absoluteFs ?? "—"}
          </span>
        ),
      },
      {
        id: "act",
        label: "",
        width: 64,
        sortable: false,
        getValue: () => "",
        cell: (r) => (
          <span className="inline-flex gap-0.5">
            <TRNIconButton
              type="button"
              label="Copy absolute path"
              disabled={!r.absoluteFs}
              icon={<Copy className="h-3.5 w-3.5" aria-hidden />}
              onClick={() => {
                if (r.absoluteFs) {
                  void onCopy(r.absoluteFs);
                }
              }}
            />
            <TRNIconButton
              type="button"
              label="Reveal in file manager"
              disabled={!r.absoluteFs || !isExtensionHost}
              icon={<FolderOpen className="h-3.5 w-3.5" aria-hidden />}
              onClick={() => {
                if (r.absoluteFs) {
                  void onReveal(r.absoluteFs);
                }
              }}
            />
          </span>
        ),
      },
    ];
  }, [isExtensionHost, onCopy, onReveal]);

  const repoColumns = useMemo((): TRNDataGridColumn<RepoDiskRow>[] => {
    return [
      { id: "area", label: "Area", width: 120, getValue: (r) => r.area },
      {
        id: "pattern",
        label: "Path pattern",
        width: 200,
        getValue: (r) => r.pathPattern,
        cell: (r) => (
          <span className="font-mono text-[10px] text-zinc-400">{r.pathPattern}</span>
        ),
      },
      { id: "notes", label: "Notes", width: 160, getValue: (r) => r.notes },
    ];
  }, []);

  const bridgeColumns = useMemo((): TRNDataGridColumn<BridgeDiskRow>[] => {
    return [
      { id: "role", label: "Role", width: 140, getValue: (r) => r.role },
      {
        id: "path",
        label: "Path",
        width: 180,
        getValue: (r) => r.path,
        cell: (r) => <span className="font-mono text-[10px] text-zinc-400">{r.path}</span>,
      },
      { id: "notes", label: "Notes", width: 200, getValue: (r) => r.notes },
    ];
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <TRNHintText tone="muted" className="mb-0 min-w-0 flex-1 text-[10px] leading-snug">
          {isExtensionHost
            ? "Absolute folders come from the extension host. Reveal only works for allowed paths under your per-user assets."
            : "Open Asset Manager inside VS Code or Cursor to load live paths, copy, and reveal. Reference tables below still match the repo layout."}
        </TRNHintText>
        {isExtensionHost ? (
          <TRNButton
            type="button"
            size="compact"
            className="shrink-0 gap-1"
            disabled={loading}
            onClick={() => void refreshPaths()}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Refresh paths
          </TRNButton>
        ) : null}
      </div>

      {feedback ? (
        <TRNHintText tone="info" className="mb-0 text-[10px]">
          {feedback}
        </TRNHintText>
      ) : null}

      <TRNAccordion type="single" defaultValue="per-user" className="min-h-0 flex-1">
        <TRNAccordionItem value="per-user">
          <TRNAccordionTrigger>Per-user storage (extension)</TRNAccordionTrigger>
          <TRNAccordionContent innerClassName="space-y-2">
            {loading && isExtensionHost ? (
              <TRNHintText tone="muted" className="mb-0 text-[10px]">
                Loading paths from host…
              </TRNHintText>
            ) : null}
            <TRNDataGrid<PerUserDiskRow>
              columns={perUserColumns}
              rows={perUserRows}
              getRowId={(r) => r.id}
              stickyHeader
              resizableColumns
            />
            <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
              Older installs may still have folders under{" "}
              <span className="font-mono text-zinc-500">models/downloads/</span> or{" "}
              <span className="font-mono text-zinc-500">free-github/</span>; move their contents into{" "}
              <span className="font-mono text-zinc-500">tesaiot/models/</span> and{" "}
              <span className="font-mono text-zinc-500">free/</span> — those legacy paths are no longer scanned.
            </TRNHintText>
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="repo">
          <TRNAccordionTrigger>Repo dev tree (src/assets)</TRNAccordionTrigger>
          <TRNAccordionContent innerClassName="space-y-2">
            <TRNDataGrid<RepoDiskRow>
              columns={repoColumns}
              rows={REPO_DISK_ROWS}
              getRowId={(r) => r.id}
              stickyHeader
            />
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="bridge">
          <TRNAccordionTrigger>Bridge / monorepo dev</TRNAccordionTrigger>
          <TRNAccordionContent innerClassName="space-y-2">
            <TRNDataGrid<BridgeDiskRow>
              columns={bridgeColumns}
              rows={BRIDGE_DISK_ROWS}
              getRowId={(r) => r.id}
              stickyHeader
            />
          </TRNAccordionContent>
        </TRNAccordionItem>
      </TRNAccordion>
    </div>
  );
}
