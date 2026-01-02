/**
 * Workflow State API Client
 * Functions for managing project workflow states
 */

import type { WorkflowState, Project } from '../types';
import { buildApiUrl } from '../config';
import { authenticatedFetch } from '@/lib/api/api-helpers';

// Re-export utility functions from workflow-utils
export {
  calculatePhaseProgress,
  calculateOverallProgress,
  getPhaseDisplayName,
  getStatusDisplayName,
  getStatusBadgeVariant,
} from '@/lib/utils/workflow-utils';

/**
 * Get workflow state for a project
 * Returns default state if not set
 */
export async function getWorkflowState(projectId: string): Promise<WorkflowState> {
  const response = await authenticatedFetch(buildApiUrl(`/api/projects/${projectId}/workflow`));
  if (!response.ok) {
    throw new Error(`Failed to get workflow state: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Update entire workflow state for a project
 */
export async function updateWorkflowState(
  projectId: string,
  workflowState: Partial<WorkflowState>
): Promise<Project> {
  const response = await authenticatedFetch(buildApiUrl(`/api/projects/${projectId}/workflow`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workflowState),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to update workflow state: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update a single step status
 */
export async function updateStepStatus(
  projectId: string,
  stepId: string,
  status: 'pending' | 'in-progress' | 'completed'
): Promise<WorkflowState> {
  const response = await authenticatedFetch(buildApiUrl(`/api/projects/${projectId}/workflow/step/${stepId}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to update step status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Move to next phase
 */
export async function moveToNextPhase(
  projectId: string,
  nextPhaseId: 'rapid-prototyping' | 'automated-qa' | 'continuous-optimization'
): Promise<Project> {
  const currentState = await getWorkflowState(projectId);

  return updateWorkflowState(projectId, {
    currentPhaseId: nextPhaseId,
    currentStepId: null, // Reset step when changing phase
    stepStatuses: currentState.stepStatuses, // Preserve existing statuses
  });
}

/**
 * Initialize workflow state with default values
 */
export async function initializeWorkflowState(projectId: string): Promise<Project> {
  return updateWorkflowState(projectId, {
    currentPhaseId: 'rapid-prototyping',
    currentStepId: null,
    stepStatuses: {},
  });
}

