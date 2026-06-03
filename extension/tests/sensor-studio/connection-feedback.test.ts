import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toastVariantForRejectReason } from "../../src/webview/sensor-studio/features/editor/connect/connection-feedback";
import {
  connectionRejectMessage,
  type ConnectionRejectReason,
} from "../../src/webview/sensor-studio/features/editor/connect/socket-connection-policy";

describe("connection-feedback", () => {
  it("maps reject reasons to user-facing copy", () => {
    const reasons: ConnectionRejectReason[] = [
      "missing_endpoints",
      "self_loop",
      "duplicate_edge",
      "type_mismatch",
    ];
    for (const reason of reasons) {
      assert.ok(connectionRejectMessage(reason).length > 4);
    }
    assert.equal(toastVariantForRejectReason("duplicate_edge"), "info");
    assert.equal(toastVariantForRejectReason("type_mismatch"), "warning");
  });
});
