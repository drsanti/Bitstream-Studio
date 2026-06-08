import { TRNButton } from "../../../ui/TRN/TRNButton";
import type { DashboardTabEntryV1 } from "../../core/dashboard/dashboard-snapshot";

type DashboardTabBarProps = {
  tabs: readonly DashboardTabEntryV1[];
  activeTabSourceNodeId: string | null;
  onActiveTabChange: (sourceNodeId: string) => void;
};

export function DashboardTabBar(props: DashboardTabBarProps) {
  const { tabs, activeTabSourceNodeId, onActiveTabChange } = props;
  const enabledTabs = tabs.filter((tab) => tab.enabled);

  if (enabledTabs.length === 0) {
    return null;
  }

  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-1 border-b px-2 py-1.5"
      style={{
        borderColor: "color-mix(in srgb, var(--dashboard-text-secondary, #a1a1aa) 25%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--dashboard-panel-bg, #18181b) 92%, transparent)",
      }}
    >
      {enabledTabs.map((tab) => {
        const selected = activeTabSourceNodeId === tab.sourceNodeId;
        return (
          <TRNButton
            key={tab.sourceNodeId}
            type="button"
            size="compact"
            selected={selected}
            hint={`Show the "${tab.label}" dashboard page.`}
            onClick={() => onActiveTabChange(tab.sourceNodeId)}
          >
            {tab.label}
          </TRNButton>
        );
      })}
    </div>
  );
}
