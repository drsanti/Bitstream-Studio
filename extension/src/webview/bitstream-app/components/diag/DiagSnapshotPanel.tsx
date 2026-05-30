import { useBitstreamDiagStore } from "../../state/bitstreamDiag.store";
import { DiagSnapshotCard } from "./DiagSnapshotCard";

export function DiagSnapshotPanel(props: {
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
  diagnosticsStreamEnabled?: boolean;
}) {
  const { collapsed, onCollapsedChange, diagnosticsStreamEnabled = false } = props;
  const { snapshot, error, updatedAt } = useBitstreamDiagStore();
  const effectiveEnabled = diagnosticsStreamEnabled || snapshot != null;
  const snapshotUpdateSource: "stream" | "poll" | "off" =
    diagnosticsStreamEnabled ? "stream" : snapshot != null ? "poll" : "off";

  return (
    <DiagSnapshotCard
      snapshot={snapshot}
      error={error}
      updatedAt={updatedAt}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      diagnosticsStreamEnabled={effectiveEnabled}
      snapshotUpdateSource={snapshotUpdateSource}
    />
  );
}
