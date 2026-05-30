import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  loadBitstreamMcpPrompts,
  loadBitstreamMcpResources,
} from "../../src/bitstream/mcp-server/descriptor-loader";
import { validateBitstreamMcpDescriptors } from "../../src/bitstream/mcp-server/descriptor-validator";
import { registerBitstreamMcpPrompts } from "../../src/bitstream/mcp-server/register-prompts";
import { registerBitstreamMcpResources } from "../../src/bitstream/mcp-server/register-resources";

interface RegisteredResource {
  name: string;
  uri: string;
  handler: (uri: URL) => Promise<{ contents: Array<{ uri: string; text: string; mimeType?: string }> }>;
}

interface RegisteredPrompt {
  name: string;
  handler: (args: unknown) => { messages: Array<{ content: { text: string } }> };
}

function createTempMcpBaseDir(): string {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "bitstream-mcp-descriptor-"));
  fs.mkdirSync(path.join(baseDir, "resources"), { recursive: true });
  fs.mkdirSync(path.join(baseDir, "resources", "examples"), { recursive: true });
  fs.mkdirSync(path.join(baseDir, "prompts"), { recursive: true });
  return baseDir;
}

function writeValidDescriptorSet(baseDir: string): void {
  fs.writeFileSync(
    path.join(baseDir, "resources", "protocol-version.json"),
    JSON.stringify(
      {
        uri: "bitstream://protocol/version",
        name: "bitstream_protocol_version",
        description: "Protocol descriptor",
        mimeType: "application/json",
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(baseDir, "resources", "RESOURCE_REGISTRY.json"),
    JSON.stringify(
      {
        resources: [
          {
            uri: "bitstream://protocol/version",
            descriptorFile: "resources/protocol-version.json",
            useWhen: "Before decode",
          },
        ],
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(baseDir, "resources", "examples", "protocol-version.sample.json"),
    JSON.stringify({ protocolVersion: "2.1.0" }, null, 2),
  );

  fs.writeFileSync(
    path.join(baseDir, "prompts", "triage.json"),
    JSON.stringify(
      {
        name: "triage_fault_events",
        description: "Fault triage",
        template: "Analyze faults",
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(baseDir, "prompts", "PROMPT_REGISTRY.json"),
    JSON.stringify(
      {
        prompts: [
          {
            name: "triage_fault_events",
            descriptorFile: "prompts/triage.json",
            useWhen: "When faults occur",
          },
        ],
      },
      null,
      2,
    ),
  );
}

test("loadBitstreamMcpResources throws for invalid descriptor", () => {
  const baseDir = createTempMcpBaseDir();
  fs.writeFileSync(
    path.join(baseDir, "resources", "broken.json"),
    JSON.stringify(
      {
        uri: "",
        name: "broken",
        description: "bad",
        mimeType: "application/json",
      },
      null,
      2,
    ),
  );

  assert.throws(
    () => loadBitstreamMcpResources({ baseDir }),
    /Invalid descriptor "uri"/,
  );
});

test("registerBitstreamMcpResources includes sample payload when available", async () => {
  const baseDir = createTempMcpBaseDir();
  writeValidDescriptorSet(baseDir);

  const resources: RegisteredResource[] = [];
  registerBitstreamMcpResources(
    {
      tool: () => {
        throw new Error("not used in this test");
      },
      prompt: () => {
        throw new Error("not used in this test");
      },
      resource: (name, uri, _metadata, handler) => {
        resources.push({ name, uri, handler });
      },
    },
    { baseDir },
  );

  assert.equal(resources.length, 1);
  const result = await resources[0].handler(new URL("bitstream://protocol/version"));
  const parsed = JSON.parse(result.contents[0].text) as { data?: { protocolVersion?: string } };
  assert.equal(parsed.data?.protocolVersion, "2.1.0");
});

test("loadBitstreamMcpPrompts validates template and register renders prompt", () => {
  const baseDir = createTempMcpBaseDir();
  writeValidDescriptorSet(baseDir);

  const prompts = loadBitstreamMcpPrompts({ baseDir });
  assert.equal(prompts.length, 1);

  const registeredPrompts: RegisteredPrompt[] = [];
  registerBitstreamMcpPrompts(
    {
      tool: () => {
        throw new Error("not used in this test");
      },
      resource: () => {
        throw new Error("not used in this test");
      },
      prompt: (name, _metadata, handler) => {
        registeredPrompts.push({ name, handler });
      },
    },
    { baseDir },
  );

  assert.equal(registeredPrompts.length, 1);
  const rendered = registeredPrompts[0].handler({ windowMs: 600 });
  assert.match(rendered.messages[0].content.text, /Analyze faults/);
  assert.match(rendered.messages[0].content.text, /Use when: When faults occur/);
});

test("validateBitstreamMcpDescriptors passes for a complete descriptor set", () => {
  const baseDir = createTempMcpBaseDir();
  writeValidDescriptorSet(baseDir);
  assert.doesNotThrow(() => validateBitstreamMcpDescriptors({ baseDir }));
});

test("validateBitstreamMcpDescriptors fails when resource example is missing", () => {
  const baseDir = createTempMcpBaseDir();
  writeValidDescriptorSet(baseDir);
  fs.rmSync(path.join(baseDir, "resources", "examples", "protocol-version.sample.json"));

  assert.throws(
    () => validateBitstreamMcpDescriptors({ baseDir }),
    /Resource example payload is missing/,
  );
});

test("registerBitstreamMcpPrompts parses JSON string for array/object template fields", () => {
  const baseDir = createTempMcpBaseDir();
  fs.writeFileSync(
    path.join(baseDir, "prompts", "triage.json"),
    JSON.stringify(
      {
        name: "triage_fault_events",
        description: "Fault triage",
        template: "Analyze faults",
        arguments: {
          type: "object",
          properties: {
            faultEvents: { type: "array" },
            diagSnapshot: { type: "object" },
          },
        },
      },
      null,
      2,
    ),
  );

  const registeredPrompts: RegisteredPrompt[] = [];
  registerBitstreamMcpPrompts(
    {
      tool: () => {
        throw new Error("not used in this test");
      },
      resource: () => {
        throw new Error("not used in this test");
      },
      prompt: (name, _metadata, handler) => {
        registeredPrompts.push({ name, handler });
      },
    },
    { baseDir },
  );

  const rendered = registeredPrompts[0].handler({
    faultEvents: '[{"code":"E_UART_TIMEOUT"}]',
    diagSnapshot: '{"transportState":"degraded"}',
  });

  assert.match(rendered.messages[0].content.text, /"faultEvents": \[/);
  assert.match(rendered.messages[0].content.text, /"diagSnapshot": \{/);
});
