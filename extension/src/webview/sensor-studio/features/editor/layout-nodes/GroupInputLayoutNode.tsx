import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { LogIn } from "lucide-react";
import { StudioGroupBoundaryCard } from "./StudioGroupBoundaryCard";

export const GroupInputLayoutNode = memo(function GroupInputLayoutNode(props: NodeProps) {
  return (
    <StudioGroupBoundaryCard
      {...props}
      role="input"
      icon={LogIn}
      title="Group Input"
    />
  );
});
