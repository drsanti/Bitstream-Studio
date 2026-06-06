import * as fs from "node:fs";
import * as path from "node:path";
import {
  EXTENSION_GLOBAL_STORAGE_FOLDER,
  listEditorGlobalStorageDirs,
  resolveExtensionGlobalStorageAssetsRoot,
  resolveExtensionGlobalStorageFreePackRoot,
} from "../extensionGlobalStoragePaths";
import { listFreeLocalAssetFiles } from "./listFreeLocalAssetFiles";
import { resolveDefaultBridgeFreeAssetsOutputDir } from "./syncTernionFreeAssets";

const SAMPLE_PATH_LIMIT = 8;

export type FreePackEditorCandidate = {
  editor: string;
  globalStorage: string;
  extensionRoot: string;
  freeRoot: string;
  extensionExists: boolean;
  freeExists: boolean;
};

export type FreePackStorageScanResult = {
  label: string;
  rootFs: string;
  exists: boolean;
  fileCount: number;
  totalBytes: number;
  samplePaths: Array<{ relativePath: string; sizeBytes: number }>;
};

export type FreePackStorageDiagnosis = {
  extensionIdFolder: string;
  hostEditorAppName?: string;
  /** When running inside VS Code — authoritative free-pack root for this host. */
  activeExtensionFreePackRootFs?: string;
  activeExtensionGlobalStorageFs?: string;
  editorCandidates: FreePackEditorCandidate[];
  resolverAssetsRoot: string | null;
  resolverFreeRoot: string | null;
  bridgeDefaultRoot: string | null;
  bridgeResolveError?: string;
  scans: FreePackStorageScanResult[];
  maxFileCount: number;
};

export function formatFreePackBytes(n: number): string {
  if (n < 1024) {
    return `${n} B`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function dirExists(p: string): boolean {
  try {
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function editorLabelFromGlobalStorage(gs: string): string {
  return path.basename(path.dirname(path.dirname(gs)));
}

export function listFreePackEditorCandidates(): FreePackEditorCandidate[] {
  return listEditorGlobalStorageDirs().map((gs) => {
    const extRoot = path.join(gs, EXTENSION_GLOBAL_STORAGE_FOLDER);
    const freeRoot = path.join(extRoot, "assets", "free");
    return {
      editor: editorLabelFromGlobalStorage(gs),
      globalStorage: gs,
      extensionRoot: extRoot,
      freeRoot,
      extensionExists: dirExists(extRoot),
      freeExists: dirExists(freeRoot),
    };
  });
}

async function scanFreePackRoot(label: string, rootFs: string): Promise<FreePackStorageScanResult> {
  const exists = dirExists(rootFs);
  if (!exists) {
    return {
      label,
      rootFs,
      exists: false,
      fileCount: 0,
      totalBytes: 0,
      samplePaths: [],
    };
  }
  const rows = await listFreeLocalAssetFiles(rootFs);
  const totalBytes = rows.reduce((sum, r) => sum + r.sizeBytes, 0);
  return {
    label,
    rootFs,
    exists: true,
    fileCount: rows.length,
    totalBytes,
    samplePaths: rows.slice(0, SAMPLE_PATH_LIMIT).map((r) => ({
      relativePath: r.relativePath,
      sizeBytes: r.sizeBytes,
    })),
  };
}

export type RunFreePackStorageDiagnosisOptions = {
  hostEditorAppName?: string;
  /** Extension host globalStorage URI fsPath (VS Code / Cursor). */
  activeExtensionGlobalStorageFs?: string;
  /** Extension host free-pack root — preferred scan target in VSIX. */
  activeExtensionFreePackRootFs?: string;
};

/**
 * Scan free-pack mirrors on disk (globalStorage heuristics + bridge default + active host root).
 */
export async function runFreePackStorageDiagnosis(
  options: RunFreePackStorageDiagnosisOptions = {},
): Promise<FreePackStorageDiagnosis> {
  const editorCandidates = listFreePackEditorCandidates();
  const resolverAssetsRoot = resolveExtensionGlobalStorageAssetsRoot();
  const resolverFreeRoot = resolveExtensionGlobalStorageFreePackRoot();

  let bridgeDefaultRoot: string | null = null;
  let bridgeResolveError: string | undefined;
  try {
    bridgeDefaultRoot = resolveDefaultBridgeFreeAssetsOutputDir();
  } catch (e) {
    bridgeResolveError = e instanceof Error ? e.message : String(e);
  }

  const scanTargets: Array<{ label: string; rootFs: string }> = [];
  const seenRoots = new Set<string>();

  const pushTarget = (label: string, rootFs: string | null | undefined): void => {
    const t = rootFs?.trim();
    if (t == null || t.length === 0) {
      return;
    }
    const resolved = path.resolve(t);
    const dedupeKey =
      process.platform === "win32" ? resolved.toLowerCase() : resolved;
    if (seenRoots.has(dedupeKey)) {
      return;
    }
    seenRoots.add(dedupeKey);
    scanTargets.push({ label, rootFs: t });
  };

  pushTarget("Active extension host (globalStorage)", options.activeExtensionFreePackRootFs);
  pushTarget("globalStorage free/ (first matching editor)", resolverFreeRoot);
  pushTarget("Bridge default output", bridgeDefaultRoot);

  const scans: FreePackStorageScanResult[] = [];
  for (const target of scanTargets) {
    scans.push(await scanFreePackRoot(target.label, target.rootFs));
  }

  const maxFileCount = scans.reduce((max, s) => Math.max(max, s.fileCount), 0);

  return {
    extensionIdFolder: EXTENSION_GLOBAL_STORAGE_FOLDER,
    hostEditorAppName: options.hostEditorAppName,
    activeExtensionFreePackRootFs: options.activeExtensionFreePackRootFs,
    activeExtensionGlobalStorageFs: options.activeExtensionGlobalStorageFs,
    editorCandidates,
    resolverAssetsRoot,
    resolverFreeRoot,
    bridgeDefaultRoot,
    bridgeResolveError,
    scans,
    maxFileCount,
  };
}

export function formatFreePackStorageDiagnosisReport(d: FreePackStorageDiagnosis): string {
  const lines: string[] = [];
  const stamp = new Date().toISOString();

  lines.push("=== TERNION free pack — globalStorage diagnosis ===");
  lines.push(`Generated: ${stamp}`);
  lines.push(`Extension id folder: ${d.extensionIdFolder}`);
  if (d.hostEditorAppName?.trim()) {
    lines.push(`Host editor: ${d.hostEditorAppName.trim()}`);
  }
  if (d.activeExtensionGlobalStorageFs?.trim()) {
    lines.push(`Extension globalStorage: ${d.activeExtensionGlobalStorageFs.trim()}`);
  }
  if (d.activeExtensionFreePackRootFs?.trim()) {
    lines.push(`Active free-pack root: ${d.activeExtensionFreePackRootFs.trim()}`);
  }
  lines.push("");

  lines.push("Editor globalStorage candidates:");
  for (const c of d.editorCandidates) {
    lines.push(`  [${c.editor}]`);
    lines.push(`    globalStorage: ${c.globalStorage}`);
    lines.push(
      `    extension:     ${c.extensionRoot} ${c.extensionExists ? "(exists)" : "(missing)"}`,
    );
    lines.push(`    assets/free:   ${c.freeRoot} ${c.freeExists ? "(exists)" : "(missing)"}`);
    lines.push("");
  }

  lines.push("Resolver (first matching editor):");
  lines.push(`  assets root: ${d.resolverAssetsRoot ?? "(none)"}`);
  lines.push(`  free root:   ${d.resolverFreeRoot ?? "(none)"}`);
  lines.push("");

  if (d.bridgeDefaultRoot) {
    lines.push("Bridge default output (npm start / model-downloader):");
    lines.push(`  ${d.bridgeDefaultRoot}`);
  } else {
    lines.push("Bridge default output: could not resolve");
    if (d.bridgeResolveError) {
      lines.push(`  ${d.bridgeResolveError.split("\n")[0]}`);
    }
  }
  lines.push("");

  for (const scan of d.scans) {
    lines.push(`Scan: ${scan.label}`);
    lines.push(`  Path: ${scan.rootFs}`);
    if (!scan.exists) {
      lines.push("  Status: directory missing");
    } else {
      lines.push(`  Files: ${scan.fileCount}`);
      lines.push(`  Total size: ${formatFreePackBytes(scan.totalBytes)}`);
      if (scan.samplePaths.length > 0) {
        lines.push("  Sample paths:");
        for (const row of scan.samplePaths) {
          lines.push(
            `    - ${row.relativePath} (${formatFreePackBytes(row.sizeBytes)})`,
          );
        }
        const hidden = scan.fileCount - scan.samplePaths.length;
        if (hidden > 0) {
          lines.push(`    … and ${hidden} more`);
        }
      }
    }
    lines.push("");
  }

  if (d.maxFileCount === 0) {
    lines.push("No files found in the resolved free-pack folder(s).");
    lines.push("Sync via Free Loader (Online catalog) or copy assets into the path above.");
    lines.push("Optional: set TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR before npm start.");
  } else {
    lines.push(`OK — ${d.maxFileCount} file(s) visible to the bridge local scan.`);
  }

  return lines.join("\n");
}
