import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import {
  TRN_INSPECTOR_PANEL_BODY_COLUMN_CLASS,
  TRN_INSPECTOR_PANEL_SCROLL_CLASS,
  TRN_INSPECTOR_PANEL_SHELL_CLASS,
} from "./trn-inspector-panel-shell";

export type TRNInspectorPanelShellProps = {
  tabs: ReactNode;
  contextBar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  scrollClassName?: string;
};

/**
 * Standard inspector layout: tab bar, optional tab-scoped context bar, scroll body.
 * Wrap tab triggers in {@link TRNTabs}; pass the tab list as `tabs` and tab bodies as `children`.
 */
export function TRNInspectorPanelShell(props: TRNInspectorPanelShellProps) {
  const { tabs, contextBar, children, footer, className, scrollClassName } = props;

  return (
    <div className={twMerge(TRN_INSPECTOR_PANEL_SHELL_CLASS, className)}>
      {tabs}
      <div className={TRN_INSPECTOR_PANEL_BODY_COLUMN_CLASS}>
        {contextBar}
        <div className={twMerge(TRN_INSPECTOR_PANEL_SCROLL_CLASS, scrollClassName)}>
          {children}
        </div>
      </div>
      {footer}
    </div>
  );
}
