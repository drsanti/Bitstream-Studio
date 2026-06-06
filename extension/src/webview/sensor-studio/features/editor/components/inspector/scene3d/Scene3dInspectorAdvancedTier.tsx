import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
} from "../../../../../../ui/TRN";
import type { Scene3dInspectorPanelId } from "../node-inspector-ui-persistence";
import { SCENE3D_INSPECTOR_ACCORDION_TRIGGER_CLASS } from "./scene3d-inspector-accordion-chrome";
import { shouldExpandScene3dAdvancedTier } from "./scene3d-inspector-advanced-search";

const ADVANCED_ACCORDION_VALUE = "advanced";

export type Scene3dInspectorAdvancedTierProps = {
  panelId: Scene3dInspectorPanelId;
  settingsSearch?: string;
  children: ReactNode;
};

export function Scene3dInspectorAdvancedTier(props: Scene3dInspectorAdvancedTierProps) {
  const { panelId, settingsSearch, children } = props;
  const forceOpen = shouldExpandScene3dAdvancedTier(panelId, settingsSearch ?? "");
  const [value, setValue] = useState<string>(() => (forceOpen ? ADVANCED_ACCORDION_VALUE : ""));

  useEffect(() => {
    if (forceOpen) {
      setValue(ADVANCED_ACCORDION_VALUE);
    }
  }, [forceOpen]);

  return (
    <TRNAccordion
      type="single"
      collapsible
      className="rounded border border-zinc-700/70 bg-zinc-950/40"
      value={value}
      onValueChange={(next) => {
        const raw = typeof next === "string" ? next : "";
        setValue(raw === ADVANCED_ACCORDION_VALUE ? ADVANCED_ACCORDION_VALUE : "");
      }}
    >
      <TRNAccordionItem value={ADVANCED_ACCORDION_VALUE} className="border-0">
        <TRNAccordionTrigger className={SCENE3D_INSPECTOR_ACCORDION_TRIGGER_CLASS}>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <SlidersHorizontal className="size-3 shrink-0 text-zinc-500" aria-hidden />
            <span className="truncate">Advanced</span>
          </span>
        </TRNAccordionTrigger>
        <TRNAccordionContent
          className="border-t border-zinc-800/60 bg-zinc-950/30"
          innerClassName="space-y-2 px-2 pb-2 pt-1.5"
        >
          {children}
        </TRNAccordionContent>
      </TRNAccordionItem>
    </TRNAccordion>
  );
}
