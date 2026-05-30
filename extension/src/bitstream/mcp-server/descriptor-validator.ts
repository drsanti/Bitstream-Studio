import fs from "node:fs";
import path from "node:path";
import {
  getBitstreamMcpResourceExamplePath,
  loadBitstreamMcpPromptRegistry,
  loadBitstreamMcpPrompts,
  loadBitstreamMcpResourceRegistry,
  loadBitstreamMcpResources,
} from "./descriptor-loader";
import type { BitstreamMcpDescriptorLoadOptions } from "./descriptor-loader";

function assertUnique(values: string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Duplicate ${label}: ${value}`);
    }
    seen.add(value);
  }
}

function assertFileExists(filePath: string, message: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${message}: ${filePath}`);
  }
}

export function validateBitstreamMcpDescriptors(options?: BitstreamMcpDescriptorLoadOptions): void {
  const resources = loadBitstreamMcpResources(options);
  const prompts = loadBitstreamMcpPrompts(options);
  const resourceRegistry = loadBitstreamMcpResourceRegistry(options);
  const promptRegistry = loadBitstreamMcpPromptRegistry(options);
  const baseDir = options?.baseDir ?? path.resolve(process.cwd(), "src/bitstream/mcp-server");

  assertUnique(resources.map((item) => item.uri), "resource uri");
  assertUnique(resources.map((item) => item.name), "resource name");
  assertUnique(prompts.map((item) => item.name), "prompt name");
  assertUnique(resourceRegistry.map((item) => item.uri), "resource registry uri");
  assertUnique(promptRegistry.map((item) => item.name), "prompt registry name");

  const resourceUriSet = new Set(resources.map((item) => item.uri));
  const promptNameSet = new Set(prompts.map((item) => item.name));

  for (const entry of resourceRegistry) {
    if (!resourceUriSet.has(entry.uri)) {
      throw new Error(`Resource registry points to unknown uri: ${entry.uri}`);
    }
    const descriptorPath = path.join(baseDir, entry.descriptorFile);
    assertFileExists(descriptorPath, "Resource descriptor file is missing");

    const examplePath = getBitstreamMcpResourceExamplePath(entry.descriptorFile, options);
    assertFileExists(examplePath, "Resource example payload is missing");
  }

  for (const descriptor of resources) {
    const hasRegistryEntry = resourceRegistry.some((entry) => entry.uri === descriptor.uri);
    if (!hasRegistryEntry) {
      throw new Error(`Resource descriptor is not listed in RESOURCE_REGISTRY.json: ${descriptor.uri}`);
    }
  }

  for (const entry of promptRegistry) {
    if (!promptNameSet.has(entry.name)) {
      throw new Error(`Prompt registry points to unknown prompt: ${entry.name}`);
    }
    const descriptorPath = path.join(baseDir, entry.descriptorFile);
    assertFileExists(descriptorPath, "Prompt descriptor file is missing");
  }

  for (const descriptor of prompts) {
    const hasRegistryEntry = promptRegistry.some((entry) => entry.name === descriptor.name);
    if (!hasRegistryEntry) {
      throw new Error(`Prompt descriptor is not listed in PROMPT_REGISTRY.json: ${descriptor.name}`);
    }
  }
}
