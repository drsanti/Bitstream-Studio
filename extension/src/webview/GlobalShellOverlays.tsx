import { SystemSerialportInfo } from "./bitstream-app/system-tools/SystemSerialportInfo";
import { SystemWebsocketActivity } from "./bitstream-app/system-tools/SystemWebsocketActivity";
import { useAdminWebsocketActivityStore } from "./bitstream-app/system-tools/admin-websocket-activity.store";
import { PostMessageTraceDashboard } from "./post-message-trace/PostMessageTraceDashboard";
import { usePostMessageTraceStore } from "./post-message-trace/post-message-trace.store";

/** Admin tools + diagnostics overlays; mount after fullscreen scene UIs. */
export function GlobalShellOverlays() {
  const adminWebsocketActivityOpen = useAdminWebsocketActivityStore(
    (s) => s.isOpen,
  );
  const closeAdminWebsocketActivity = useAdminWebsocketActivityStore(
    (s) => s.close,
  );
  const postMessageTraceOpen = usePostMessageTraceStore((s) => s.isOpen);
  const closePostMessageTrace = usePostMessageTraceStore((s) => s.close);

  return (
    <>
      <SystemWebsocketActivity
        open={adminWebsocketActivityOpen}
        onClose={closeAdminWebsocketActivity}
      />
      <PostMessageTraceDashboard
        open={postMessageTraceOpen}
        onClose={closePostMessageTrace}
      />
      <SystemSerialportInfo />
    </>
  );
}
