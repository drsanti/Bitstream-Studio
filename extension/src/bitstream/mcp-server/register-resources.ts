import fs from "node:fs";
import { getBitstreamMcpResourceExamplePath, loadBitstreamMcpResourceRegistry, loadBitstreamMcpResources } from "./descriptor-loader";
import type { BitstreamMcpServerLike } from "./types";
import type { BitstreamMcpDescriptorLoadOptions } from "./descriptor-loader";

export function registerBitstreamMcpResources(
  server: BitstreamMcpServerLike,
  options?: BitstreamMcpDescriptorLoadOptions,
): void {
  const resourceDescriptors = loadBitstreamMcpResources(options);
  if (resourceDescriptors.length === 0) {
    return;
  }

  const registryByUri = new Map(
    loadBitstreamMcpResourceRegistry(options).map((entry) => [entry.uri, entry] as const),
  );

  for (const descriptor of resourceDescriptors) {
    server.resource(
      descriptor.name,
      descriptor.uri,
      {
        title: descriptor.name,
        description: descriptor.description,
        mimeType: descriptor.mimeType,
      },
      async (uri) => {
        const registryEntry = registryByUri.get(descriptor.uri);
        const examplePath = registryEntry
          ? getBitstreamMcpResourceExamplePath(registryEntry.descriptorFile, options)
          : null;
        const resourcePayload = examplePath && fs.existsSync(examplePath)
          ? JSON.parse(fs.readFileSync(examplePath, "utf8"))
          : null;
        const resourceInfo = {
          uri: descriptor.uri,
          name: descriptor.name,
          description: descriptor.description,
          mimeType: descriptor.mimeType,
          useWhen: registryEntry?.useWhen ?? null,
          data: resourcePayload,
        };
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: descriptor.mimeType,
              text: JSON.stringify(resourceInfo, null, 2),
            },
          ],
        };
      },
    );
  }
}
