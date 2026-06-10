import { Box, FolderTree, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { Diagram3dModelIdV1, DiagramV1 } from "../schemas/diagram.v1";
import { buildCourseDiagramModelSelectOptions } from "../content/courseDiagramGlbCatalog";
import {
  findDiagram3dNode,
  listDiagram3dNodes,
} from "../runtime/diagram/diagram3dNodeMutations";
import { spawnCourseScene3dGroupNode } from "./courseScene3dAddCatalog";
import { CourseDiagramCatalogModelPreview } from "./CourseDiagramCatalogModelPreview";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { Diagram3dAnimationFields } from "./Diagram3dAnimationFields";
import { Diagram3dMaterialFields } from "./Diagram3dMaterialFields";
import { Diagram3dPropertyBindingsFields } from "./Diagram3dPropertyBindingsFields";
import { Diagram3dRotationFields } from "./Diagram3dRotationFields";
import { Diagram3dTransformFields } from "./Diagram3dTransformFields";
import { useDiagram3dDocumentEditor } from "./diagram3dDocumentEditorContext";

function Diagram3dNodePicker({
  diagramId,
  diagram,
  selectedNodeId,
}: {
  diagramId: string;
  diagram: DiagramV1;
  selectedNodeId: string | null;
}) {
  const { setSelectedNodeId } = useDiagram3dDocumentEditor(diagramId);
  const entries = listDiagram3dNodes(diagram);

  return (
    <TRNFormField id={`${diagramId}-3d-node-picker`} label="Select 3D model">
      <TRNSelect
        value={selectedNodeId ?? "__none__"}
        ariaLabel="3D model picker"
        options={[
          { value: "__none__", label: "— click viewport or pick —" },
          ...entries.map((entry) => ({
            value: entry.id,
            label:
              entry.type === "group3d"
                ? `${entry.id} · group`
                : `${entry.id} · ${entry.modelId ?? entry.type}`,
          })),
        ]}
        onValueChange={(value) => {
          if (value !== "__none__") {
            setSelectedNodeId(value);
          }
        }}
      />
    </TRNFormField>
  );
}

function GroupChildList({
  diagramId,
  diagram,
  groupId,
}: {
  diagramId: string;
  diagram: DiagramV1;
  groupId: string;
}) {
  const { setSelectedNodeId } = useDiagram3dDocumentEditor(diagramId);
  const group = findDiagram3dNode(diagram, groupId);
  if (group?.type !== "group3d" || group.children.length === 0) {
    return (
      <TRNHintText className="!text-[10px]">
        No child models yet — use Shift+A or the object pill to add models to this group.
      </TRNHintText>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {group.children.map((child) => (
        <li key={child.id}>
          <TRNButton
            size="compact"
            className="h-auto w-full justify-start px-2 py-1.5 text-left font-normal"
            onClick={() => setSelectedNodeId(child.id)}
          >
            <span className="font-medium text-zinc-200">{child.id}</span>
            <span className="text-zinc-500">
              {child.type === "model" ? ` · ${child.modelId}` : " · group"}
            </span>
          </TRNButton>
        </li>
      ))}
    </ul>
  );
}

export function CourseDiagram3dNodeInspector({
  diagramId,
  diagram,
}: {
  diagramId: string;
  diagram: DiagramV1;
}) {
  const { selectedNodeId, patchNode, removeNode, addNode } = useDiagram3dDocumentEditor(diagramId);
  const modelOptions = useMemo(() => buildCourseDiagramModelSelectOptions(), []);

  const node =
    selectedNodeId != null ? findDiagram3dNode(diagram, selectedNodeId) : null;

  if (node == null) {
    return (
      <CourseInspectorCard
        title="3D model"
        hint="Select a model or group in the viewport to edit transform, rotation, and material."
        titleIcon={<Box className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultExpanded
      >
        <div className="flex flex-col gap-3">
          <Diagram3dNodePicker
            diagramId={diagramId}
            diagram={diagram}
            selectedNodeId={selectedNodeId}
          />
          <TRNHintText className="!text-[10px]">
            Click an object in the 3D viewport, or use Shift+A / right-click to add objects. Drag
            the gizmo to move; adjust fields here after selecting.
          </TRNHintText>
          <TRNButton
            size="compact"
            className="self-start"
            onClick={() => addNode(spawnCourseScene3dGroupNode())}
          >
            + Group
          </TRNButton>
        </div>
      </CourseInspectorCard>
    );
  }

  if (node.type === "group3d") {
    return (
      <div className="flex flex-col gap-3">
        <CourseInspectorCard
          title="3D group"
          hint={`${node.id} · hierarchy and transforms.`}
          titleIcon={<Box className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
          defaultExpanded
        >
          <div className="flex flex-col gap-3">
            <Diagram3dNodePicker
              diagramId={diagramId}
              diagram={diagram}
              selectedNodeId={selectedNodeId}
            />
            <TRNHintText className="!text-[10px]">
              Group transforms apply to all child models.
            </TRNHintText>
          </div>
        </CourseInspectorCard>

        <CourseInspectorCard
          title="Children"
          hint="Models nested under this group."
          titleIcon={<FolderTree className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
          defaultExpanded
        >
          <GroupChildList diagramId={diagramId} diagram={diagram} groupId={node.id} />
        </CourseInspectorCard>

        <Diagram3dTransformFields
          diagramId={diagramId}
          diagram={diagram}
          nodeId={node.id}
          node={node}
        />
        <Diagram3dRotationFields diagramId={diagramId} nodeId={node.id} rotation={node.rotation} />

        <TRNButton
          size="compact"
          className="self-start border-red-500/35 text-red-300"
          onClick={() => removeNode(node.id)}
        >
          <Trash2 size={13} strokeWidth={2} className="mr-1 inline" />
          Delete group
        </TRNButton>
      </div>
    );
  }

  if (node.type !== "model") {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <CourseInspectorCard
        title="3D model"
        hint={`${node.id} · preset and catalog preview.`}
        titleIcon={<Box className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultExpanded
      >
        <div className="flex flex-col gap-3">
          <Diagram3dNodePicker
            diagramId={diagramId}
            diagram={diagram}
            selectedNodeId={selectedNodeId}
          />

          <TRNFormField id={`${node.id}-model-id`} label="Model preset">
            <TRNSelect
              value={node.modelId}
              ariaLabel="3D model preset"
              options={modelOptions}
              onValueChange={(modelId) =>
                patchNode(node.id, { modelId: modelId as Diagram3dModelIdV1 })
              }
            />
          </TRNFormField>

          <CourseDiagramCatalogModelPreview modelId={node.modelId} />
        </div>
      </CourseInspectorCard>

      <Diagram3dTransformFields
        diagramId={diagramId}
        diagram={diagram}
        nodeId={node.id}
        node={node}
      />
      <Diagram3dRotationFields diagramId={diagramId} nodeId={node.id} rotation={node.rotation} />
      <Diagram3dPropertyBindingsFields
        diagramId={diagramId}
        nodeId={node.id}
        position={node.position}
        scale={node.scale}
      />
      <Diagram3dMaterialFields
        nodeId={node.id}
        material={node.material}
        defaultExpanded
        onPatch={(patch) => patchNode(node.id, patch)}
      />
      <Diagram3dAnimationFields node={node} onPatch={(patch) => patchNode(node.id, patch)} />

      <TRNButton
        size="compact"
        className="self-start border-red-500/35 text-red-300"
        onClick={() => removeNode(node.id)}
      >
        <Trash2 size={13} strokeWidth={2} className="mr-1 inline" />
        Delete 3D model
      </TRNButton>
    </div>
  );
}
