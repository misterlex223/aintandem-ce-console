/**
 * Workflow Page - Display and manage project workflow state
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkflowLifecycle } from '@/components/workflow/WorkflowLifecycle';
import type { WorkflowState, Project, Workflow } from '@/lib/types';

import {
  getWorkflowState,
  moveToNextPhase,
  getPhaseDisplayName,
  calculateOverallProgress
} from '@/lib/api/workflow';
import { getClient } from '@/lib/api/api-helpers';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function WorkflowPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [workflowDefinition, setWorkflowDefinition] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch project and workflow state
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch project using SDK
        const client = getClient();
        const projectData = await client.workspaces.getProject(projectId) as any;
        setProject(projectData);

        // Fetch workflow state
        const state = await getWorkflowState(projectId);
        setWorkflowState(state);

        // Fetch the assigned workflow definition if project has a workflow
        if (projectData.workflowId) {
          const workflow = await client.workflows.getWorkflow(projectData.workflowId) as any;
          setWorkflowDefinition(workflow);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workflow');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Handle step status change (for future use)
  // const handleStepStatusChange = async (stepId: string, status: 'pending' | 'in-progress' | 'completed') => {
  //   if (!projectId) return;
  //
  //   try {
  //     const updatedState = await updateStepStatus(projectId, stepId, status);
  //     setWorkflowState(updatedState);
  //   } catch (err) {
  //     console.error('Failed to update step status:', err);
  //     setError(err instanceof Error ? err.message : 'Failed to update step status');
  //   }
  // };

  // Handle phase change
  const handlePhaseChange = async (phaseId: 'rapid-prototyping' | 'automated-qa' | 'continuous-optimization') => {
    if (!projectId) return;

    try {
      const updatedProject = await moveToNextPhase(projectId, phaseId);
      setProject(updatedProject);
      if (updatedProject.workflowState) {
        setWorkflowState(updatedProject.workflowState);
      }
    } catch (err) {
      console.error('Failed to change phase:', err);
      setError(err instanceof Error ? err.message : 'Failed to change phase');
    }
  };

  // Calculate progress
  const progress = workflowState ? calculateOverallProgress(workflowState) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (error || !project || !workflowState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || 'Project not found'}</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Base
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-page-container min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Workflow Management
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-muted-foreground">Current Phase</div>
              <div className="text-lg font-semibold">
                {getPhaseDisplayName(workflowState.currentPhaseId)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Overall Progress: {progress}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Visualization - Full Width */}
      <div className="px-6 py-8">
        <WorkflowLifecycle
          baseUrl={`/flexy/${project.sandboxId}/docs`}
          workflowDefinition={workflowDefinition} // Pass the actual workflow definition

          theme={{
            primary: '#1976d2',
            secondary: '#dc004e',
            background: '#f5f5f5'
          }}
          project={project}
        />
      </div>

      {/* Phase Transition Controls */}
      <div className="px-6 py-8">
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Phase Transitions</h2>
          <div className="flex gap-4">
            <Button
              variant={workflowState.currentPhaseId === 'rapid-prototyping' ? 'default' : 'outline'}
              onClick={() => handlePhaseChange('rapid-prototyping')}
            >
              🚀 快速原型
            </Button>
            <Button
              variant={workflowState.currentPhaseId === 'automated-qa' ? 'default' : 'outline'}
              onClick={() => handlePhaseChange('automated-qa')}
            >
              🤖 自動化QA
            </Button>
            <Button
              variant={workflowState.currentPhaseId === 'continuous-optimization' ? 'default' : 'outline'}
              onClick={() => handlePhaseChange('continuous-optimization')}
            >
              📈 持續優化
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkflowPage;
