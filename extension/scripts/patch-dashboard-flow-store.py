from pathlib import Path

p = Path("src/webview/sensor-studio/features/editor/store/flow-editor.store.ts")
text = p.read_text(encoding="utf-8")


def repl(old: str, new: str, label: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f"{label}: marker missing")
    text = text.replace(old, new, 1)


repl(
    'import { evaluateStageSceneSnapshot } from "../../../core/stage/evaluate-stage-scene-snapshot";',
    'import { evaluateDashboardSnapshot } from "../../../core/dashboard/evaluate-dashboard-snapshot";\n'
    'import { evaluateStageSceneSnapshot } from "../../../core/stage/evaluate-stage-scene-snapshot";',
    "dashboard import",
)
repl(
    'import { useStageSceneStore } from "../../../state/stage-scene.store";',
    'import { useDashboardSceneStore } from "../../../state/dashboard-scene.store";\n'
    'import { useStageSceneStore } from "../../../state/stage-scene.store";',
    "dashboard store import",
)

repl(
    '  | "stage-scene-output";',
    '  | "stage-scene-output"\n  | "dashboard-button-led";',
    "demo template id",
)

repl(
    """  dispatchStagePickEvent: (event: {
    button: number;
    modelIndex: number;
    sourceNodeId: string;
    hitPoint: { x: number; y: number; z: number };
    objectPath: string;
  }) => boolean;
};""",
    """  dispatchStagePickEvent: (event: {
    button: number;
    modelIndex: number;
    sourceNodeId: string;
    hitPoint: { x: number; y: number; z: number };
    objectPath: string;
  }) => boolean;
  /** Domain C — Dashboard button click → wired event outputs. */
  dispatchDashboardWidgetEvent: (event: { sourceNodeId: string }) => void;
  /** Dashboard knob drag → update config value and re-tick simulation. */
  dispatchDashboardKnobValue: (event: { sourceNodeId: string; value: number }) => void;
};""",
    "store type",
)

repl(
    """    if (nodes.length === 0) {
      useStageSceneStore.getState().resetSnapshot();
      return;
    }""",
    """    if (nodes.length === 0) {
      useStageSceneStore.getState().resetSnapshot();
      useDashboardSceneStore.getState().resetSnapshot();
      return;
    }""",
    "empty reset",
)

repl(
    """        if (
          node.data.nodeId === "number-constant" ||
          node.data.nodeId === "float-constant" ||
          node.data.nodeId === "integer-constant"
        ) {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const v = coerceNumberConstantValue(dc, dc.value);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), v);
          continue;
        }""",
    """        if (
          node.data.nodeId === "knob" ||
          node.data.nodeId === "dashboard-knob"
        ) {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const raw = dc.value;
          const v =
            typeof raw === "number" && Number.isFinite(raw)
              ? raw
              : coerceNumberConstantValue(dc, raw);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), v);
          continue;
        }

        if (
          node.data.nodeId === "number-constant" ||
          node.data.nodeId === "float-constant" ||
          node.data.nodeId === "integer-constant"
        ) {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const v = coerceNumberConstantValue(dc, dc.value);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), v);
          continue;
        }""",
    "knob pin eval",
)

repl(
    """        if (node.data.nodeId === "scene-output") {
          patchSceneOutputLiveWires(base, node.id);
        }""",
    """        if (node.data.nodeId === "scene-output") {
          patchSceneOutputLiveWires(base, node.id);
        }

        if (
          node.data.nodeId === "dashboard-led" ||
          node.data.nodeId === "dashboard-text" ||
          node.data.nodeId === "dashboard-gauge"
        ) {
          const wired = readIncoming(node.id, STUDIO_HANDLE_IN);
          if (typeof wired === "number" && Number.isFinite(wired)) {
            base.liveValue = wired;
          } else if (typeof wired === "boolean") {
            base.liveValue = wired;
          } else {
            base.liveValue = null;
          }
          base.liveHistory = [];
        }

        if (node.data.nodeId === "dashboard-knob") {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const raw = dc.value;
          base.liveValue =
            typeof raw === "number" && Number.isFinite(raw) ? raw : null;
          base.liveHistory = [];
        }""",
    "dashboard live value",
)

repl(
    """    useStageSceneStore
      .getState()
      .setSnapshot(
        evaluateStageSceneSnapshot({
          nodes: stageNodes,
          edges,
        }),
      );
  },""",
    """    useStageSceneStore
      .getState()
      .setSnapshot(
        evaluateStageSceneSnapshot({
          nodes: stageNodes,
          edges,
        }),
      );
    useDashboardSceneStore
      .getState()
      .setSnapshot(
        evaluateDashboardSnapshot({
          nodes,
          edges,
        }),
      );
  },
  dispatchDashboardWidgetEvent: (event) => {
    const source = get().nodes.find((n) => n.id === event.sourceNodeId);
    if (source == null || source.data.nodeId !== "dashboard-button") {
      return;
    }
    dispatchFlowEventSourcesFromHandle(
      get,
      set,
      [source.id],
      STUDIO_HANDLE_OUT,
    );
  },
  dispatchDashboardKnobValue: (event) => {
    const { sourceNodeId, value } = event;
    if (!Number.isFinite(value)) {
      return;
    }
    get().updateNodeConfigFieldByNodeId(sourceNodeId, "value", value);
    get().tickSimulation();
  },""",
    "dashboard snapshot + dispatch",
)

demo_block = """    if (templateId === "dashboard-button-led") {
      const sineEntry = catalog.find((entry) => entry.id === "sine-wave");
      const outputEntry = catalog.find((entry) => entry.id === "dashboard-output");
      const textEntry = catalog.find((entry) => entry.id === "dashboard-text");
      const gaugeEntry = catalog.find((entry) => entry.id === "dashboard-gauge");
      const buttonEntry = catalog.find((entry) => entry.id === "dashboard-button");
      const setBoolEntry = catalog.find((entry) => entry.id === "event-set-boolean");
      const ledEntry = catalog.find((entry) => entry.id === "dashboard-led");
      if (
        sineEntry == null ||
        outputEntry == null ||
        textEntry == null ||
        buttonEntry == null ||
        setBoolEntry == null ||
        ledEntry == null
      ) {
        return;
      }

      const sineNode = makeNode(sineEntry, "demo-dash-sine", 80, 80);
      sineNode.data.label = "Sine Wave";
      const textNode = makeNode(textEntry, "demo-dash-text", 80, 240);
      textNode.data.label = "RPM";
      const gaugeNode =
        gaugeEntry != null
          ? makeNode(gaugeEntry, "demo-dash-gauge", 80, 400)
          : null;
      if (gaugeNode != null) {
        gaugeNode.data.label = "Gauge";
      }
      const buttonNode = makeNode(buttonEntry, "demo-dash-button", 80, 560);
      buttonNode.data.label = "Toggle LED";
      const setBoolNode = makeNode(setBoolEntry, "demo-dash-set-bool", 360, 560);
      setBoolNode.data.defaultConfig = {
        ...setBoolNode.data.defaultConfig,
        setTo: true,
        value: true,
      };
      const ledNode = makeNode(ledEntry, "demo-dash-led", 620, 560);
      ledNode.data.label = "Status LED";
      const outputNode = makeNode(outputEntry, "demo-dash-output", 900, 300);
      outputNode.data.label = "Dashboard Output";

      const templateNodes: StudioNode[] = [
        sineNode,
        textNode,
        buttonNode,
        setBoolNode,
        ledNode,
        outputNode,
      ];
      if (gaugeNode != null) {
        templateNodes.splice(2, 0, gaugeNode);
      }

      const templateEdges: Edge[] = [
        {
          id: "demo-dash-e1",
          source: sineNode.id,
          target: textNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: getSourcePortType(sineNode, STUDIO_HANDLE_OUT) ?? "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-dash-e2",
          source: textNode.id,
          target: outputNode.id,
          sourceHandle: STUDIO_HANDLE_WIDGET,
          targetHandle: STUDIO_HANDLE_WIDGETS,
          animated: true,
          label: "dashboardWidget",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-dash-e3",
          source: buttonNode.id,
          target: setBoolNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: "event",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-dash-e4",
          source: setBoolNode.id,
          target: ledNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: "boolean",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-dash-e5",
          source: buttonNode.id,
          target: outputNode.id,
          sourceHandle: STUDIO_HANDLE_WIDGET,
          targetHandle: STUDIO_HANDLE_WIDGETS,
          animated: true,
          label: "dashboardWidget",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-dash-e6",
          source: ledNode.id,
          target: outputNode.id,
          sourceHandle: STUDIO_HANDLE_WIDGET,
          targetHandle: STUDIO_HANDLE_WIDGETS,
          animated: true,
          label: "dashboardWidget",
          style: { strokeWidth: 2 },
        },
      ];

      if (gaugeNode != null) {
        templateEdges.splice(1, 0, {
          id: "demo-dash-e1b",
          source: sineNode.id,
          target: gaugeNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: getSourcePortType(sineNode, STUDIO_HANDLE_OUT) ?? "number",
          style: { strokeWidth: 2 },
        });
        templateEdges.splice(3, 0, {
          id: "demo-dash-e2b",
          source: gaugeNode.id,
          target: outputNode.id,
          sourceHandle: STUDIO_HANDLE_WIDGET,
          targetHandle: STUDIO_HANDLE_WIDGETS,
          animated: true,
          label: "dashboardWidget",
          style: { strokeWidth: 2 },
        });
      }

      get().pushUndoSnapshot();
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(templateNodes, [outputNode.id]),
          templateEdges,
        ),
        edges: templateEdges,
        ...selectionFromIds([outputNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

"""

repl(
    '    if (templateId === "stage-scene-output") {',
    demo_block + '    if (templateId === "stage-scene-output") {',
    "demo template",
)

p.write_text(text, encoding="utf-8")
print("patched flow-editor.store.ts")
