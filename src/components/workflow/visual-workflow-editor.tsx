import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  ControlButton,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Panel,
  ReactFlowProvider,
  SmoothStepEdge,
  SimpleBezierEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Phase, WorkflowStep } from '@/lib/types';
import { PhaseEditorDialog } from './phase-editor-dialog';
import { StepEditorDialog } from './step-editor-dialog';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PhaseNodeWithDnD } from './phase-node';
import { StepNodeWithDnD } from './step-node';

interface VisualWorkflowEditorProps {
  phases: Phase[];
  transitions: { from: string; to: string; label?: string; type: 'forward' | 'feedback' | 'loop' }[];
  onChange: (phases: Phase[]) => void;
  disabled?: boolean;
}

export function VisualWorkflowEditor({ phases, transitions, onChange, disabled }: VisualWorkflowEditorProps) {
  // Memoize nodeTypes to ensure stable reference for React Flow
  const nodeTypes = useMemo(() => ({
    phaseNode: PhaseNodeWithDnD,
    stepNode: StepNodeWithDnD,
  }), [PhaseNodeWithDnD, StepNodeWithDnD]);

  // Memoize edgeTypes to ensure stable reference for React Flow
  const edgeTypes = useMemo(() => ({
    smoothstep: SmoothStepEdge,
    simplebezier: SimpleBezierEdge,
  }), []);

  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number>(-1);
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false);
  const [phaseDialogMode, setPhaseDialogMode] = useState<'add' | 'edit'>('add');

  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [selectedStepIndices, setSelectedStepIndices] = useState<{ phaseIndex: number; stepIndex: number }>({ phaseIndex: -1, stepIndex: -1 });
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [stepDialogMode, setStepDialogMode] = useState<'add' | 'edit'>('add');

  // Function to move a phase from one position to another
  const movePhase = useCallback((fromIndex: number, toIndex: number) => {
    const updatedPhases = [...phases];
    const [movedPhase] = updatedPhases.splice(fromIndex, 1);
    updatedPhases.splice(toIndex, 0, movedPhase);
    onChange(updatedPhases);
  }, [phases, onChange]);

  // Function to move a step within a phase from one position to another
  const moveStep = useCallback((phaseId: string, fromIndex: number, toIndex: number) => {
    const phaseIndex = phases.findIndex(p => p.id === phaseId);
    if (phaseIndex === -1) return;

    const updatedPhases = [...phases];
    const updatedPhase = { ...updatedPhases[phaseIndex] };
    const updatedSteps = [...updatedPhase.steps];
    const [movedStep] = updatedSteps.splice(fromIndex, 1);
    updatedSteps.splice(toIndex, 0, movedStep);

    updatedPhase.steps = updatedSteps;
    updatedPhases[phaseIndex] = updatedPhase;
    onChange(updatedPhases);
  }, [phases, onChange]);

  // Helper function to get outgoing transitions for a phase
  const getOutgoingTransitions = (phaseId: string, allTransitions: typeof transitions) => {
    return allTransitions.filter(transition => transition.from === phaseId);
  };

  // Helper function to get transition style based on type
  const getTransitionStyle = (type: string) => {
    switch (type) {
    case 'feedback':
      return { stroke: '#ff6b6b', strokeWidth: 2, strokeDasharray: '5,5' }; // Red dashed for feedback
    case 'loop':
      return { stroke: '#ffd93d', strokeWidth: 2, strokeDasharray: '8,3,2,3' }; // Yellow dotted-dashed for loop
    default: // forward
      return { stroke: '#007acc', strokeWidth: 2 }; // Blue solid for forward (no strokeDasharray for solid line)
    }
  };

  // Helper function to get edge type based on transition type
  const getEdgeType = (transitionType: string | null = null) => {
    if (transitionType) {
      // For phase-to-phase transitions, use simplebezier for feedback/loop, smoothstep for forward
      return transitionType === 'forward' ? 'smoothstep' : 'simplebezier';
    }
    // For other connections (step-to-step, etc.), use smoothstep by default
    return 'smoothstep';
  };

  // Helper function to create edges with business logic for determining field values
  const createEdge = (
    id: string,
    source: string,
    target: string,
    connectionType: 'phase-to-phase' | 'phase-to-step' | 'step-to-step' | 'linked-workflow',
    options: {
      animated?: boolean;
      style?: React.CSSProperties;
      label?: string;
      type?: string;
      transitionType?: 'forward' | 'feedback' | 'loop';
      customSourceHandle?: string;
      customTargetHandle?: string;
      customEdgeType?: string;
    } = {}
  ) => {
    // Determine handles based on connection type and transition type
    let sourceHandle = options.customSourceHandle;
    let targetHandle = options.customTargetHandle;
    let edgeType = options.customEdgeType || options.type;
    let edgeStyle = options.style;
    let edgeLabel = options.label;
    let isAnimated = options.animated;

    if (connectionType === 'phase-to-phase') {
      // For phase-to-phase transitions, determine handles and styling based on transition type
      const transition = options.transitionType || 'forward';

      // Determine source handle based on transition type
      sourceHandle = sourceHandle ||
                    (transition === 'forward' ? 'phase-output-forward' :
                      transition === 'feedback' ? 'phase-output-feedback' :
                        'phase-output-loop');

      // Determine target handle based on transition type
      targetHandle = targetHandle ||
                    (transition === 'forward' ? 'phase-input' :
                      transition === 'feedback' ? 'phase-input-feedback' :
                        'phase-input-loop');

      // Determine edge type based on transition type
      edgeType = edgeType || getEdgeType(transition);

      // Determine style based on transition type
      edgeStyle = edgeStyle || getTransitionStyle(transition);

      // Determine label based on transition type if not provided
      edgeLabel = edgeLabel || (options.label || getTransitionLabel(transition));

      // Phase-to-phase transitions are animated by default
      isAnimated = isAnimated !== undefined ? isAnimated : true;
    } else if (connectionType === 'phase-to-step') {
      // For phase-to-step connections
      sourceHandle = sourceHandle || 'phase-output-step';
      targetHandle = targetHandle || 'step-input';
      edgeType = edgeType || 'smoothstep';
      edgeStyle = edgeStyle || { stroke: '#555', strokeWidth: 1 };
      isAnimated = isAnimated !== undefined ? isAnimated : false;
    } else if (connectionType === 'step-to-step') {
      // For step-to-step connections
      sourceHandle = sourceHandle || 'step-output';
      targetHandle = targetHandle || 'step-input';
      edgeType = edgeType || 'smoothstep';
      edgeStyle = edgeStyle || { stroke: '#555', strokeWidth: 1 };
      isAnimated = isAnimated !== undefined ? isAnimated : false;
    } else if (connectionType === 'linked-workflow') {
      // For linked workflow connections
      sourceHandle = sourceHandle || 'step-output';
      targetHandle = targetHandle || 'phase-input';
      edgeType = edgeType || 'smoothstep';
      edgeStyle = edgeStyle || { stroke: '#00cc66', strokeWidth: 1, strokeDasharray: '5,5' };
      edgeLabel = edgeLabel || (options.label || `🔗 ${options.label || 'Linked'}`);
      isAnimated = isAnimated !== undefined ? isAnimated : false;
    }

    const edge = {
      id,
      source,
      sourceHandle,
      target,
      targetHandle,
      animated: isAnimated,
      style: edgeStyle,
      label: edgeLabel,
      type: edgeType,
    };

    // Add additional parameters for simplebezier edges to improve curvature
    if (edgeType === 'simplebezier') {
      // Add curve smoothness to enhance the curvature of simplebezier edges
      (edge as any).curveSmoothness = 0.4;
    }

    return edge;
  };

  // Helper function to get transition label based on type
  const getTransitionLabel = (type: string) => {
    switch (type) {
    case 'feedback':
      return 'Feedback';
    case 'loop':
      return 'Loop';
    default:
      return 'Next';
    }
  };

  // Convert phases and steps to React Flow nodes and edges
  const elements = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Debug: Log transitions data
    // console.log('VisualWorkflowEditor transitions:', JSON.stringify(transitions));
    // console.log('VisualWorkflowEditor phases:', JSON.stringify(phases));

    // Create nodes for phases
    phases.forEach((phase, phaseIndex) => {
      // Calculate position based on phase index
      const phaseX = 100;
      const phaseY = 250 * phaseIndex; // Increased spacing between phases

      // Add phase node
      const phaseNode: Node = {
        id: `phase-${phase.id}`,
        type: 'phaseNode',
        position: { x: phaseX, y: phaseY },
        data: {
          phase,
          onEdit: () => handleEditPhase(phase, phaseIndex),
          onDelete: () => handleDeletePhase(phaseIndex),
          onAddStep: () => handleAddStep(phaseIndex),
          onMovePhase: movePhase,
          index: phaseIndex,
        },
        width: 250,
        height: 100,
        dragHandle: '.drag-handle', // Specify the drag handle class
      };
      nodes.push(phaseNode);

      // Add nodes for steps within the phase
      phase.steps.forEach((step, stepIndex) => {
        // Position steps below the phase node
        const stepNode: Node = {
          id: `step-${step.id}`,
          type: 'stepNode',
          position: { x: phaseX + 20, y: phaseY + 120 + (stepIndex * 90) }, // Position steps below phase
          data: {
            step,
            onEdit: () => handleEditStep(phaseIndex, step, stepIndex),
            onDelete: () => handleDeleteStep(phaseIndex, stepIndex),
            phaseId: phase.id,
            onMoveStep: moveStep,
            index: stepIndex,
            phaseIndex: phaseIndex,
          },
          width: 200,
          height: 80,
          dragHandle: '.drag-handle', // Specify the drag handle class
        };
        nodes.push(stepNode);
      });
    });

    // Add connection edges between phases based on transitions
    // This should come after all nodes are created

    // console.log('Processing transitions for phases:', phases.length);
    // console.log('Total transitions in data:', transitions.length);

    for (const phase of phases) {
      // Find transitions that start from this phase
      const outgoingTransitions = getOutgoingTransitions(phase.id, transitions);

      // console.log(`Phase ${phase.id} (${phase.title}) has ${outgoingTransitions.length} outgoing transitions`, JSON.stringify(outgoingTransitions));

      for (const transition of outgoingTransitions) {
        // Find the target phase
        const targetPhase = phases.find(p => p.id === transition.to);
        // console.log(`Processing transition: ${transition.from} -> ${transition.to} (type: ${transition.type})`);

        if (targetPhase) {
          // console.log(`Found target phase: ${targetPhase.id} (${targetPhase.title})`);
          edges.push(createEdge(
            `transition-${phase.id}-${targetPhase.id}`,
            `phase-${phase.id}`,
            `phase-${targetPhase.id}`,
            'phase-to-phase',
            {
              transitionType: transition.type,
              label: transition.label,
            }
          ));
        } else {
          console.log(`Target phase ${transition.to} not found for transition from ${phase.id}`);
        }
      }
    }

    // console.log('Created edges:', JSON.stringify(edges));

    // Add sequential step connections within each phase
    // First step connects from phase, subsequent steps connect from previous step
    for (const phase of phases) {
      const phaseSteps = phase.steps;
      for (let i = 0; i < phaseSteps.length; i++) {
        const currentStepId = phaseSteps[i].id;

        if (i === 0) {
          // First step connects from its parent phase
          edges.push(createEdge(
            `seq-${phase.id}-${currentStepId}`,
            `phase-${phase.id}`,
            `step-${currentStepId}`,
            'phase-to-step'
          ));
        } else {
          // Subsequent steps connect from the previous step
          const prevStepId = phaseSteps[i-1].id;
          edges.push(createEdge(
            `seq-${prevStepId}-${currentStepId}`,
            `step-${prevStepId}`,
            `step-${currentStepId}`,
            'step-to-step'
          ));
        }
      }
    }

    // Add connection edges for linked workflows within steps
    for (const phase of phases) {
      for (const step of phase.steps) {
        // Check if the step has linked workflows
        if (step.workflows && step.workflows.length > 0) {
          for (let i = 0; i < step.workflows.length; i++) {
            const linkedWorkflow = step.workflows[i];

            // Add an edge from the step to indicate the linked workflow
            // This creates a visual indicator of the relationship
            edges.push(createEdge(
              `link-${step.id}-${i}`,
              `step-${step.id}`,
              `phase-${phase.id}`, // For now, connect back to the parent phase
              'linked-workflow',
              {
                label: `🔗 ${linkedWorkflow.name || 'Linked'}`,
              }
            ));
          }
        }
      }
    }

    return { nodes, edges };
  }, [phases, transitions, movePhase, moveStep]);

  // Custom layout function to position nodes according to requested rules:
  // 1. Phases arranged from left to right
  // 2. Steps arranged vertically below their parent phase
  // 3. Steps linked sequentially within each phase
  const layoutNodes = useCallback((nodes: Node[]): Node[] => {
    // Calculate phase positions from left to right
    const phaseToFirstStepSpacing = 200; // Vertical spacing between a phase and its first step
    const phaseSpacing = 400; // Horizontal distance between phases (increased to account for phase width)
    const stepSpacing = 200; // Vertical distance between steps
    const phaseStartX = 50; // Starting x position for first phase
    const phaseStartY = 50; // Starting y position for phases

    const positionedNodes: Node[] = [];

    // Create a mapping from the original phases data to understand the relationship
    // This ensures we correctly map each step to its parent phase
    const phaseNodeMap: Record<string, Node> = {};

    // First pass: identify and temporarily store phase nodes
    for (const node of nodes) {
      if (node.id.startsWith('phase-')) {
        const phaseId = node.id.replace('phase-', '');
        phaseNodeMap[phaseId] = node;
      }
    }

    // Second pass: for each phase in the correct order (as defined in the phases array), position it and its steps
    // This ensures that when phases are reordered, they maintain the correct layout position
    phases.forEach((originalPhase, index) => {
      const phaseNode = phaseNodeMap[originalPhase.id];
      if (!phaseNode) return; // Skip if phase node doesn't exist

      const newX = phaseStartX + (index * phaseSpacing);

      // Position the phase
      positionedNodes.push({
        ...phaseNode,
        position: {
          x: newX,
          y: phaseStartY
        }
      });

      // Position steps for this phase according to their order in the phase definition
      // This ensures that when steps are reordered within a phase, they maintain the correct layout position
      originalPhase.steps.forEach((step, stepIndex) => {
        const stepNode = nodes.find(n => n.id === `step-${step.id}`);
        if (stepNode) {
          positionedNodes.push({
            ...stepNode,
            position: {
              x: newX, // Align with phase
              y: phaseStartY + (phaseNode.height || 100) + phaseToFirstStepSpacing + (stepIndex * stepSpacing) // Below the phase with configurable buffer
            }
          });
        }
      });
    });

    return positionedNodes;
  }, [phases]);

  // Create layouted elements
  const layoutedElements = useMemo(() => {
    const layoutedNodes = layoutNodes(elements.nodes);
    return { nodes: layoutedNodes, edges: elements.edges };
  }, [elements, layoutNodes]);

  const [, , onNodesChange] = useNodesState(layoutedElements.nodes);
  const [, setEdges, onEdgesChange] = useEdgesState(layoutedElements.edges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Phase operations
  const handleAddPhase = () => {
    setSelectedPhase(null);
    setPhaseDialogMode('add');
    setIsPhaseDialogOpen(true);
  };

  const handleEditPhase = (phase: Phase, index: number) => {
    setSelectedPhase(phase);
    setSelectedPhaseIndex(index);
    setPhaseDialogMode('edit');
    setIsPhaseDialogOpen(true);
  };

  const handleSavePhase = (phase: Phase) => {
    if (phaseDialogMode === 'add') {
      onChange([...phases, phase]);
    } else {
      const updatedPhases = [...phases];
      updatedPhases[selectedPhaseIndex] = phase;
      onChange(updatedPhases);
    }
  };

  const handleDeletePhase = (index: number) => {
    if (phases.length === 1) {
      alert('Cannot delete the last phase. A workflow must have at least one phase.');
      return;
    }
    if (confirm('Are you sure you want to delete this phase? All steps within it will be deleted.')) {
      const updatedPhases = phases.filter((_, i) => i !== index);
      onChange(updatedPhases);
    }
  };



  // Step operations
  const handleAddStep = (phaseIndex: number) => {
    setSelectedStep(null);
    setSelectedStepIndices({ phaseIndex, stepIndex: -1 });
    setStepDialogMode('add');
    setIsStepDialogOpen(true);
  };

  const handleEditStep = (phaseIndex: number, step: WorkflowStep, stepIndex: number) => {
    setSelectedStep(step);
    setSelectedStepIndices({ phaseIndex, stepIndex });
    setStepDialogMode('edit');
    setIsStepDialogOpen(true);
  };

  const handleSaveStep = (step: WorkflowStep) => {
    const updatedPhases = [...phases];
    const phase = { ...updatedPhases[selectedStepIndices.phaseIndex] };

    if (stepDialogMode === 'add') {
      phase.steps = [...phase.steps, step];
    } else {
      phase.steps = [...phase.steps];
      phase.steps[selectedStepIndices.stepIndex] = step;
    }

    updatedPhases[selectedStepIndices.phaseIndex] = phase;
    onChange(updatedPhases);
  };

  const handleDeleteStep = (phaseIndex: number, stepIndex: number) => {
    const phase = phases[phaseIndex];
    if (phase.steps.length === 1) {
      alert('Cannot delete the last step. A phase must have at least one step.');
      return;
    }

    if (confirm('Are you sure you you want to delete this step?')) {
      const updatedPhases = [...phases];
      const updatedPhase = { ...updatedPhases[phaseIndex] };
      updatedPhase.steps = updatedPhase.steps.filter((_, i) => i !== stepIndex);
      updatedPhases[phaseIndex] = updatedPhase;
      onChange(updatedPhases);
    }
  };



  // State to manage MiniMap visibility
  const [showMiniMap, setShowMiniMap] = useState(false);

  // State to manage Annotation Panel visibility
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);

  // Handle click on the main diagram to hide MiniMap
  const handleDiagramClick = useCallback(() => {
    setShowMiniMap(false);
  }, []);

  // Handle click on MiniMap to keep it visible
  const handleMiniMapClick = useCallback((event: React.MouseEvent) => {
    // Prevent the click from propagating to the main diagram
    event.stopPropagation();
    setShowMiniMap(true);
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="visual-workflow-editor h-[600px] border rounded-lg">
        <ReactFlowProvider>
          <ReactFlow
            nodes={layoutedElements.nodes}
            edges={layoutedElements.edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.5, includeHiddenNodes: true }}
            onPaneClick={handleDiagramClick}
            elementsSelectable={true}
            nodesDraggable={true}
            nodesConnectable={true}
            nodeDragThreshold={1}
            disableKeyboardA11y={true}
          >
            <Background color="#aaa" gap={16} />
            {showMiniMap && (
              <MiniMap
                position="bottom-left"
                pannable
                zoomable
                maskColor="rgba(0, 0, 0, 0.6)" // Make the invisible area more dark
                ariaLabel="Workflow overview"
                style={{ left: '40px' }} // Position to avoid overlap with controls
                onClick={handleMiniMapClick}
              />
            )}
            <Controls position="bottom-left">
              <ControlButton onClick={() => setShowMiniMap(!showMiniMap)}>
                {showMiniMap ? (
                  <span className="text-xs">[-]</span> // Hide icon
                ) : (
                  <span className="text-xs">[+]</span> // Show icon
                )}
              </ControlButton>
              <ControlButton onClick={() => setShowAnnotationPanel(!showAnnotationPanel)}>
                {showAnnotationPanel ? (
                  <span className="text-xs">[L-]</span> // Hide legend icon
                ) : (
                  <span className="text-xs">[L+]</span> // Show legend icon
                )}
              </ControlButton>
            </Controls>
            {showAnnotationPanel && (
              <Panel position="top-right">
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={handleAddPhase} disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Phase
                  </Button>
                  {/* Enhanced legend for visual elements */}
                  <div className="p-3 bg-white rounded-lg shadow-md border text-xs max-w-xs">
                    <div className="font-medium mb-2">Legend</div>
                    <div className="space-y-1">
                      <div className='font-semibold text-sm mb-1'>Phase Colors:</div>
                      <div className='space-y-1 pl-2 mb-2'>
                        <div className='flex items-center gap-2'>
                          <div className='w-4 h-4 rounded border border-gray-300' style={{background: '#E3F2FD'}}></div>
                          <span>Rapid Prototyping</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='w-4 h-4 rounded border border-gray-300' style={{background: '#E8F5E9'}}></div>
                          <span>Automated QA</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='w-4 h-4 rounded border border-gray-300' style={{background: '#FFF3E0'}}></div>
                          <span>Continuous Optimization</span>
                        </div>
                      </div>

                      <div className='font-semibold text-sm mb-1'>Step Types:</div>
                      <div className='space-y-1 pl-2 mb-2'>
                        <div className='flex items-center gap-2'>
                          <span>⚙️</span>
                          <span>Process</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span>🏁</span>
                          <span>Milestone</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span>❓</span>
                          <span>Decision</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span>📄</span>
                          <span>Documentation</span>
                        </div>
                      </div>

                      <div className='font-semibold text-sm mb-1'>Special Indicators:</div>
                      <div className='space-y-1 pl-2 mb-2'>
                        <div className='flex items-center gap-2'>
                          <span className='text-blue-500'>⚡</span>
                          <span>Executable Task</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-green-500'>🔗</span>
                          <span>Linked Workflows</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-orange-400 border border-orange-400 rounded px-1'>HI</span>
                          <span>Human Input Required</span>
                        </div>
                      </div>

                      <div className='font-semibold text-sm mb-1'>Transitions:</div>
                      <div className='space-y-1 pl-2'>
                        <div className='flex items-center gap-2'>
                          <div className='w-4 h-0.5 bg-blue-500' style={{width: '16px'}}></div>
                          <span>Forward</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='w-4 h-0.5 bg-red-500' style={{width: '16px'}}></div>
                          <span>Feedback</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='w-4 h-0.5 bg-yellow-500' style={{width: '16px'}}></div>
                          <span>Loop</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='w-4 h-0.5 bg-gray-500' style={{width: '16px'}}></div>
                          <span>Step Sequence</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </ReactFlowProvider>

        {/* Phase Editor Dialog */}
        <PhaseEditorDialog
          open={isPhaseDialogOpen}
          onOpenChange={setIsPhaseDialogOpen}
          phase={selectedPhase}
          onSave={handleSavePhase}
          title={phaseDialogMode === 'add' ? 'Add Phase' : 'Edit Phase'}
        />

        {/* Step Editor Dialog */}
        <StepEditorDialog
          open={isStepDialogOpen}
          onOpenChange={setIsStepDialogOpen}
          step={selectedStep}
          onSave={handleSaveStep}
          title={stepDialogMode === 'add' ? 'Add Step' : 'Edit Step'}
        />
      </div>
    </DndProvider>
  );
}