import fs from "node:fs";
import path from "node:path";
import type {
  BitstreamMcpPromptDescriptor,
  BitstreamMcpResourceDescriptor,
  BitstreamMcpPromptRegistryEntry,
  BitstreamMcpResourceRegistryEntry,
} from "./descriptor-types";

export interface BitstreamMcpDescriptorLoadOptions {
  baseDir?: string;
}

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function isJsonFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".json");
}

function getMcpServerBaseDir(options?: BitstreamMcpDescriptorLoadOptions): string {
  if (options?.baseDir) {
    return options.baseDir;
  }
  return directoryPathOrFallback(__dirname);
}

function getResourcesDir(options?: BitstreamMcpDescriptorLoadOptions): string {
  return path.join(getMcpServerBaseDir(options), "resources");
}

function getPromptsDir(options?: BitstreamMcpDescriptorLoadOptions): string {
  return path.join(getMcpServerBaseDir(options), "prompts");
}

function readDescriptorFiles<T>(directoryPath: string, skipFiles: Set<string>): Array<{ filePath: string; value: T }> {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs
    .readdirSync(directoryPath)
    .filter((fileName) => isJsonFile(fileName) && !skipFiles.has(fileName))
    .map((fileName) => {
      const filePath = path.join(directoryPath, fileName);
      return {
        filePath,
        value: readJsonFile<T>(filePath),
      };
    });
}

function assertStringField(value: unknown, fieldName: string, filePath: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid descriptor "${fieldName}" in ${filePath}`);
  }
  return value;
}

function validateResourceDescriptor(
  descriptor: BitstreamMcpResourceDescriptor,
  filePath: string,
): BitstreamMcpResourceDescriptor {
  return {
    uri: assertStringField(descriptor.uri, "uri", filePath),
    name: assertStringField(descriptor.name, "name", filePath),
    description: assertStringField(descriptor.description, "description", filePath),
    mimeType: assertStringField(descriptor.mimeType, "mimeType", filePath),
  };
}

function validatePromptDescriptor(descriptor: BitstreamMcpPromptDescriptor, filePath: string): BitstreamMcpPromptDescriptor {
  return {
    name: assertStringField(descriptor.name, "name", filePath),
    description: assertStringField(descriptor.description, "description", filePath),
    template: assertStringField(descriptor.template, "template", filePath),
    arguments: descriptor.arguments,
    output_contract: descriptor.output_contract,
  };
}

function directoryPathOrFallback(currentModuleDir: string): string {
  const resourcesDir = path.join(currentModuleDir, "resources");
  if (fs.existsSync(resourcesDir)) {
    return currentModuleDir;
  }
  // In some runtimes this module is loaded from `out/bitstream/mcp-server`.
  // Fall back to source tree so descriptors remain discoverable in dev and tests.
  return path.resolve(process.cwd(), "src/bitstream/mcp-server");
}

export function loadBitstreamMcpResources(options?: BitstreamMcpDescriptorLoadOptions): BitstreamMcpResourceDescriptor[] {
  return readDescriptorFiles<BitstreamMcpResourceDescriptor>(getResourcesDir(options), new Set(["RESOURCE_REGISTRY.json"]))
    .map(({ filePath, value }) => validateResourceDescriptor(value, filePath));
}

export function loadBitstreamMcpPrompts(options?: BitstreamMcpDescriptorLoadOptions): BitstreamMcpPromptDescriptor[] {
  return readDescriptorFiles<BitstreamMcpPromptDescriptor>(getPromptsDir(options), new Set(["PROMPT_REGISTRY.json"]))
    .map(({ filePath, value }) => validatePromptDescriptor(value, filePath));
}

export function loadBitstreamMcpResourceRegistry(
  options?: BitstreamMcpDescriptorLoadOptions,
): BitstreamMcpResourceRegistryEntry[] {
  const filePath = path.join(getResourcesDir(options), "RESOURCE_REGISTRY.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const parsed = readJsonFile<{ resources?: BitstreamMcpResourceRegistryEntry[] }>(filePath);
  const entries = Array.isArray(parsed.resources) ? parsed.resources : [];
  return entries.map((entry) => ({
    uri: assertStringField(entry.uri, "uri", filePath),
    descriptorFile: assertStringField(entry.descriptorFile, "descriptorFile", filePath),
    useWhen: assertStringField(entry.useWhen, "useWhen", filePath),
  }));
}

export function loadBitstreamMcpPromptRegistry(
  options?: BitstreamMcpDescriptorLoadOptions,
): BitstreamMcpPromptRegistryEntry[] {
  const filePath = path.join(getPromptsDir(options), "PROMPT_REGISTRY.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const parsed = readJsonFile<{ prompts?: BitstreamMcpPromptRegistryEntry[] }>(filePath);
  const entries = Array.isArray(parsed.prompts) ? parsed.prompts : [];
  return entries.map((entry) => ({
    name: assertStringField(entry.name, "name", filePath),
    descriptorFile: assertStringField(entry.descriptorFile, "descriptorFile", filePath),
    useWhen: assertStringField(entry.useWhen, "useWhen", filePath),
  }));
}

export function getBitstreamMcpResourceExamplePath(
  descriptorFile: string,
  options?: BitstreamMcpDescriptorLoadOptions,
): string {
  const baseName = path.basename(descriptorFile, ".json");
  return path.join(getResourcesDir(options), "examples", `${baseName}.sample.json`);
}
