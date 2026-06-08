import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { LogOut } from "lucide-react";
import { StudioGroupBoundaryCard } from "./StudioGroupBoundaryCard";

export const GroupOutputLayoutNode = memo(function GroupOutputLayoutNode(props: NodeProps) {
  return (
    <StudioGroupBoundaryCard
      {...props}
      role="output"
      icon={LogOut}
      title="Group Output"
    />
  );
});
