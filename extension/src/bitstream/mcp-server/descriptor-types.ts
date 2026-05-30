export interface BitstreamMcpResourceDescriptor {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface BitstreamMcpPromptDescriptor {
  name: string;
  description: string;
  template: string;
  arguments?: unknown;
  output_contract?: unknown;
}

export interface BitstreamMcpResourceRegistryEntry {
  uri: string;
  descriptorFile: string;
  useWhen: string;
}

export interface BitstreamMcpPromptRegistryEntry {
  name: string;
  descriptorFile: string;
  useWhen: string;
}
