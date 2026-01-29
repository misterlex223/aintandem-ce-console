/**
 * API Module - Only retain project-specific workflow state management
 *
 * ⚠️ All other API calls should use @aintandem/sdk-react's useAInTandem hook:
 *
 * import { useAInTandem } from '@aintandem/sdk-react';
 *
 * function MyComponent() {
 *   const { client } = useAInTandem();
 *   // Use client.workflows, client.tasks, client.sandboxes, etc.
 * }
 */

// ============================================================================
// Workflow State API (Project-specific workflow state management)
// This is different from SDK's WorkflowService - SDK manages workflow definitions,
// this manages project execution state (currentPhaseId, stepStatuses, etc.)
// ============================================================================
export * from './workflow';

// ============================================================================
// Auth API (Custom authentication - not yet in SDK)
// ============================================================================
export * from './auth';
