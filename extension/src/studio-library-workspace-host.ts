import * as fs from "fs/promises";
import * as vscode from "vscode";

const LIBRARY_DIR = ".bitstream/library";
const FLOWS_DIR = "flows";
const GROUPS_DIR = "groups";

export type StudioLibraryWorkspaceMirrorV1 = {
  version: 1;
  updatedAt: string;
  flowPresets: unknown[];
  groupAssets: unknown[];
};

function workspaceLibraryRoot(): vscode.Uri | null {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (folder == null) {
    return null;
  }
  return vscode.Uri.joinPath(folder.uri, ...LIBRARY_DIR.split("/"));
}

export function parseStudioLibraryWorkspaceMirrorJson(raw: string): StudioLibraryWorkspaceMirrorV1 | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StudioLibraryWorkspaceMirrorV1>;
    if (parsed.version !== 1) {
      return null;
    }
    if (!Array.isArray(parsed.flowPresets) || !Array.isArray(parsed.groupAssets)) {
      return null;
    }
    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      flowPresets: parsed.flowPresets,
      groupAssets: parsed.groupAssets,
    };
  } catch {
    return null;
  }
}

async function readJsonFile(uri: vscode.Uri): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(uri.fsPath, "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

async function listPresetFiles(dirUri: vscode.Uri): Promise<vscode.Uri[]> {
  try {
    const entries = await vscode.workspace.fs.readDirectory(dirUri);
    return entries
      .filter(([name, type]) => type === vscode.FileType.File && name.endsWith(".json"))
      .map(([name]) => vscode.Uri.joinPath(dirUri, name));
  } catch {
    return [];
  }
}

export async function readStudioLibraryWorkspaceMirror(): Promise<{
  mirror: StudioLibraryWorkspaceMirrorV1 | null;
  workspacePath: string | null;
}> {
  const root = workspaceLibraryRoot();
  if (root == null) {
    return { mirror: null, workspacePath: null };
  }

  const flowsDir = vscode.Uri.joinPath(root, FLOWS_DIR);
  const groupsDir = vscode.Uri.joinPath(root, GROUPS_DIR);
  const flowFiles = await listPresetFiles(flowsDir);
  const groupFiles = await listPresetFiles(groupsDir);

  const flowPresets = (await Promise.all(flowFiles.map((uri) => readJsonFile(uri)))).filter(
    (row): row is unknown => row != null,
  );
  const groupAssets = (await Promise.all(groupFiles.map((uri) => readJsonFile(uri)))).filter(
    (row): row is unknown => row != null,
  );

  if (flowPresets.length === 0 && groupAssets.length === 0) {
    return { mirror: null, workspacePath: root.fsPath };
  }

  return {
    mirror: {
      version: 1,
      updatedAt: new Date().toISOString(),
      flowPresets,
      groupAssets,
    },
    workspacePath: root.fsPath,
  };
}

export async function writeStudioLibraryWorkspaceMirror(configJson: string): Promise<string | null> {
  const mirror = parseStudioLibraryWorkspaceMirrorJson(configJson);
  if (mirror == null) {
    return null;
  }
  const root = workspaceLibraryRoot();
  if (root == null) {
    return null;
  }

  const flowsDir = vscode.Uri.joinPath(root, FLOWS_DIR);
  const groupsDir = vscode.Uri.joinPath(root, GROUPS_DIR);
  await fs.mkdir(flowsDir.fsPath, { recursive: true });
  await fs.mkdir(groupsDir.fsPath, { recursive: true });

  for (const preset of mirror.flowPresets) {
    const meta = (preset as { meta?: { id?: string } }).meta;
    const id = typeof meta?.id === "string" ? meta.id : `flow-${Date.now()}`;
    const safeId = id.replace(/[^a-zA-Z0-9_-]+/g, "-");
    const fileUri = vscode.Uri.joinPath(flowsDir, `${safeId}.trn-flow-preset.json`);
    await fs.writeFile(fileUri.fsPath, JSON.stringify(preset, null, 2), "utf8");
  }

  for (const asset of mirror.groupAssets) {
    const meta = (asset as { meta?: { id?: string } }).meta;
    const id = typeof meta?.id === "string" ? meta.id : `group-${Date.now()}`;
    const safeId = id.replace(/[^a-zA-Z0-9_-]+/g, "-");
    const fileUri = vscode.Uri.joinPath(groupsDir, `${safeId}.trn-node-asset.json`);
    await fs.writeFile(fileUri.fsPath, JSON.stringify(asset, null, 2), "utf8");
  }

  return root.fsPath;
}
