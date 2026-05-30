import test from "node:test";
import assert from "node:assert/strict";

import { openAssistantHtmlInBrowser } from "../../src/webview/ui/TRN/htmlPreviewDelivery.store";

type MockDoc = {
  open: () => void;
  write: (s: string) => void;
  close: () => void;
};

test("openAssistantHtmlInBrowser writes HTML into new tab when popup allowed", () => {
  const writes: string[] = [];
  const mockDoc: MockDoc = {
    open: () => undefined,
    write: (s) => writes.push(s),
    close: () => undefined,
  };

  // Minimal window mock.
  (globalThis as unknown as { window: unknown }).window = {
    open: () => ({ document: mockDoc }),
    setTimeout: () => 0,
  };

  const ok = openAssistantHtmlInBrowser("<!DOCTYPE html><html><body>ok</body></html>");
  assert.equal(ok, true);
  assert.equal(writes.length, 1);
  assert.match(writes[0] ?? "", /<body>ok<\/body>/);
});

test("openAssistantHtmlInBrowser downloads preview.html when popup blocked", () => {
  let clicked = 0;
  const created: Array<{ href?: string; download?: string }> = [];

  (globalThis as unknown as { window: unknown }).window = {
    open: () => null,
    setTimeout: () => 0,
  };

  (globalThis as unknown as { document: unknown }).document = {
    createElement: () => {
      const el: {
        href?: string;
        download?: string;
        click?: () => void;
        remove?: () => void;
      } = {
        click: () => {
          clicked += 1;
        },
        remove: () => undefined,
      };
      created.push(el);
      return el;
    },
    body: {
      appendChild: () => undefined,
    },
  };

  // URL + Blob exist in Node, but URL.createObjectURL may not.
  const realCreateObjectURL = URL.createObjectURL;
  const realRevokeObjectURL = URL.revokeObjectURL;
  let revoked = 0;
  (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = () => "blob:mock";
  (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = () => {
    revoked += 1;
  };

  try {
    const ok = openAssistantHtmlInBrowser("<html>dl</html>");
    assert.equal(ok, true);
    assert.equal(clicked, 1);
    assert.equal(created[0]?.download, "preview.html");
    assert.equal(created[0]?.href, "blob:mock");
    assert.equal(revoked, 0); // we don't fire timers in this unit test
  } finally {
    URL.createObjectURL = realCreateObjectURL;
    URL.revokeObjectURL = realRevokeObjectURL;
  }
});

