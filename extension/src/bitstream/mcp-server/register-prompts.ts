import * as z from "zod/v4";
import { loadBitstreamMcpPromptRegistry, loadBitstreamMcpPrompts } from "./descriptor-loader";
import type { BitstreamMcpServerLike } from "./types";
import type { BitstreamMcpDescriptorLoadOptions } from "./descriptor-loader";

function toTemplateInput(args: unknown): string {
  if (args === null || args === undefined) {
    return "{}";
  }
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
}

type PromptJsonSchema = {
  type?: string;
  properties?: Record<string, PromptJsonSchema>;
  required?: string[];
};

type PromptArgsRecord = Record<string, unknown>;

function toZodField(schema: PromptJsonSchema | undefined): z.ZodTypeAny {
  switch (schema?.type) {
    case "string":
      return z.string();
    case "number":
      return z.number();
    case "integer":
      return z.number().int();
    case "boolean":
      return z.boolean();
    case "array":
      return z.string();
    case "object":
      return z.string();
    default:
      return z.unknown();
  }
}

function buildPromptArgsSchema(argumentsSchema: unknown): Record<string, z.ZodTypeAny> | undefined {
  if (!argumentsSchema || typeof argumentsSchema !== "object" || Array.isArray(argumentsSchema)) {
    return undefined;
  }

  const schema = argumentsSchema as PromptJsonSchema;
  if (schema.type !== "object" || !schema.properties || typeof schema.properties !== "object") {
    return undefined;
  }

  const required = new Set(Array.isArray(schema.required) ? schema.required : []);
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, value] of Object.entries(schema.properties)) {
    const fieldSchema = toZodField(value);
    shape[key] = required.has(key) ? fieldSchema : fieldSchema.optional();
  }

  return Object.keys(shape).length > 0 ? shape : undefined;
}

function parseJsonStringIfNeeded(value: unknown, expectedType: string | undefined): unknown {
  if (typeof value !== "string") {
    return value;
  }
  if (expectedType !== "array" && expectedType !== "object") {
    return value;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (expectedType === "array" && Array.isArray(parsed)) {
      return parsed;
    }
    if (expectedType === "object" && parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return value;
  }
  return value;
}

function normalizeArgsForTemplate(argumentsSchema: unknown, args: unknown): unknown {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return args;
  }
  if (!argumentsSchema || typeof argumentsSchema !== "object" || Array.isArray(argumentsSchema)) {
    return args;
  }

  const schema = argumentsSchema as PromptJsonSchema;
  const properties = schema.properties;
  if (!properties || typeof properties !== "object") {
    return args;
  }

  const normalized: PromptArgsRecord = { ...(args as PromptArgsRecord) };
  for (const [key, propertySchema] of Object.entries(properties)) {
    normalized[key] = parseJsonStringIfNeeded(normalized[key], propertySchema?.type);
  }
  return normalized;
}

export function registerBitstreamMcpPrompts(
  server: BitstreamMcpServerLike,
  options?: BitstreamMcpDescriptorLoadOptions,
): void {
  const promptDescriptors = loadBitstreamMcpPrompts(options);
  if (promptDescriptors.length === 0) {
    return;
  }

  const registryByName = new Map(loadBitstreamMcpPromptRegistry(options).map((entry) => [entry.name, entry] as const));

  for (const descriptor of promptDescriptors) {
    server.prompt(
      descriptor.name,
      {
        title: descriptor.name,
        description: descriptor.description,
        argsSchema: buildPromptArgsSchema(descriptor.arguments),
      },
      (args) => {
        const registryEntry = registryByName.get(descriptor.name);
        const normalizedArgs = normalizeArgsForTemplate(descriptor.arguments, args);
        const promptText = [
          descriptor.template,
          "",
          registryEntry?.useWhen ? `Use when: ${registryEntry.useWhen}` : "",
          "Input arguments:",
          toTemplateInput(normalizedArgs),
        ]
          .filter((line) => line.length > 0)
          .join("\n");

        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text: promptText,
              },
            },
          ],
        };
      },
    );
  }
}
