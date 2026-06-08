import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeStudioLibraryWorkspaceMirror,
  parseStudioLibraryWorkspaceMirror,
} from "../../src/webview/sensor-studio/persistence/studio-library-workspace-mirror";

test("mergeStudioLibraryWorkspaceMirror prefers newer updatedAt", () => {
  const merged = mergeStudioLibraryWorkspaceMirror({
    localFlows: [
      {
        marker: "trn-flow-preset",
        version: 1,
        meta: {
          id: "flow-1",
          name: "Local",
          category: "custom",
          presetKind: "flowFull",
          activeGraphId: "__root__",
          sourceScopeId: "__root__",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
        document: { version: 1, nodes: [], edges: [], subgraphs: {} },
      },
    ],
    localGroups: [],
    mirror: {
      version: 1,
      updatedAt: "2026-06-07T00:00:00.000Z",
      flowPresets: [
        {
          marker: "trn-flow-preset",
          version: 1,
          meta: {
            id: "flow-1",
            name: "Workspace",
            category: "custom",
            presetKind: "flowFull",
            activeGraphId: "__root__",
            sourceScopeId: "__root__",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-06-07T00:00:00.000Z",
          },
          document: { version: 1, nodes: [], edges: [], subgraphs: {} },
        },
      ],
      groupAssets: [],
    },
  });

  assert.equal(merged.flowPresets[0]?.meta.name, "Workspace");
});

test("parseStudioLibraryWorkspaceMirror rejects invalid payload", () => {
  assert.equal(parseStudioLibraryWorkspaceMirror("{}"), null);
});
