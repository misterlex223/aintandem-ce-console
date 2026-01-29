/**
 * Workflow Utility Functions
 * Client-side utilities for workflow state management
 */

import type { WorkflowState } from '@/lib/types';

/**
 * Calculate progress percentage for current phase
 */
export function calculatePhaseProgress(
  workflowState: WorkflowState,
  phaseStepIds: string[]
): number {
  const phaseStatuses = phaseStepIds.map(id => workflowState.stepStatuses[id] || 'pending');
  const completed = phaseStatuses.filter(s => s === 'completed').length;
  return phaseStepIds.length > 0 ? Math.round((completed / phaseStepIds.length) * 100) : 0;
}

/**
 * Calculate overall progress across all phases
 */
export function calculateOverallProgress(
  workflowState: WorkflowState
): number {
  const allStatuses = Object.values(workflowState.stepStatuses);
  if (allStatuses.length === 0) return 0;

  const completed = allStatuses.filter(s => s === 'completed').length;
  return Math.round((completed / allStatuses.length) * 100);
}

/**
 * Get display name for phase
 */
export function getPhaseDisplayName(
  phaseId: string
): string {
  const phases: Record<string, string> = {
    'rapid-prototyping': '🚀 快速原型',
    'automated-qa': '🤖 自動化QA',
    'continuous-optimization': '📈 持續優化',
  };
  return phases[phaseId] || phaseId;
}

/**
 * Get display name for step status
 */
export function getStatusDisplayName(
  status: 'pending' | 'in-progress' | 'completed'
): string {
  const statuses: Record<string, string> = {
    'pending': '待處理',
    'in-progress': '進行中',
    'completed': '已完成',
  };
  return statuses[status] || status;
}

/**
 * Get status badge variant
 */
export function getStatusBadgeVariant(
  status: 'pending' | 'in-progress' | 'completed'
): 'secondary' | 'default' | 'outline' {
  const variants: Record<string, 'secondary' | 'default' | 'outline'> = {
    'pending': 'secondary',
    'in-progress': 'default',
    'completed': 'outline',
  };
  return variants[status] || 'secondary';
}
