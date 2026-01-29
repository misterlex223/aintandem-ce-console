/**
 * API Helpers - Transitional Helper Functions
 *
 * These functions handle APIs that have not yet been migrated to SDK.
 * TODO: Remove this file and use SDK directly when SDK supports these features.
 */

import { buildApiUrl } from '@/lib/config';
import { electronApiProxy } from '@/lib/utils/desktop';

/**
 * Helper function to handle unauthorized responses
 * Clears auth data and redirects to login page
 */
export function handleUnauthorized() {
  // Clear auth data (use the same keys as SDK)
  localStorage.removeItem('aintandem_token');
  localStorage.removeItem('aintandem_refresh_token');

  // Redirect to login page
  window.location.href = '/login';
}

// ============================================================================
// Authenticated Fetch (Transitional)
// ============================================================================
// TODO: Remove this function when all API calls are migrated to SDK
// Direct use of authenticatedFetch should be replaced with SDK client methods

/**
 * Helper function to make authenticated API calls
 * This is a transitional function for APIs not yet migrated to SDK.
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const fetchMethod = window.__IN_AINTANDEM_DESKTOP__ ? electronApiProxy : fetch;
  // Add authentication token if available (use the same key as SDK)
  const token = localStorage.getItem('aintandem_token');
  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetchMethod(url, {
    ...options,
    headers
  });

  // Check if the response is unauthorized (401) or forbidden (403)
  if (response.status === 401 || response.status === 403) {
    handleUnauthorized();
  }

  return response;
}

// ============================================================================
// SDK Client Utilities
// ============================================================================

import { AInTandemClient } from '@aintandem/sdk-core';
import type { AInTandemClientConfig } from '@aintandem/sdk-core';

// Global client instance (singleton)
let clientInstance: AInTandemClient | null = null;

/**
 * Initialize or get the SDK client instance
 * Used by non-React code to access the SDK
 */
export function getClient(): AInTandemClient {
  if (!clientInstance) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    const config: AInTandemClientConfig = {
      baseURL: API_BASE_URL || window.location.origin,
    };
    clientInstance = new AInTandemClient(config);
  }
  return clientInstance;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetClient(): void {
  clientInstance = null;
}

// ============================================================================
// Directory Browsing (not in SDK)
// Note: SDK does not provide directory browsing functionality
// ============================================================================

export async function browseDirectories(path: string | null): Promise<{
  currentPath: string;
  directories: string[];
}> {
  const response = await authenticatedFetch(buildApiUrl('/api/host/directories'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPath: path }),
  });
  if (!response.ok) {
    throw new Error(`Failed to browse directories: ${response.statusText}`);
  }
  return response.json();
}

// ============================================================================
// Task APIs (partially in SDK)
// Note: Some task operations are not available in SDK yet
// ============================================================================

export async function rerunTask(taskId: string): Promise<any> {
  // Note: SDK does not have rerunTask method, use direct API
  const response = await authenticatedFetch(buildApiUrl(`/api/tasks/${taskId}/rerun`), {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to rerun task: ${response.statusText}`);
  }
  return response.json();
}

// ============================================================================
// Workflow Execution State APIs (not in SDK)
// Note: These are project workflow execution state APIs, not workflow definition APIs
// The SDK's WorkflowService manages workflow definitions/templates, not execution state
// ============================================================================

export async function executeWorkflowStep(
  projectId: string,
  stepId: string,
  additionalInput?: string
): Promise<any> {
  // Note: SDK does not have executeWorkflowStep method, use direct API
  const response = await authenticatedFetch(buildApiUrl(`/api/projects/${projectId}/workflow/execute`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stepId, additionalInput }),
  });
  if (!response.ok) {
    throw new Error(`Failed to execute workflow step: ${response.statusText}`);
  }
  return response.json();
}

// ============================================================================
// Workflow Status Helper Functions (UI helpers, not API calls)
// These are for workflow definition status (published/draft/archived)
// Not to be confused with step status (pending/in-progress/completed)
// ============================================================================

export function getWorkflowStatusDisplayName(
  status: 'published' | 'draft' | 'archived'
): string {
  const statuses: Record<string, string> = {
    'published': 'Published',
    'draft': 'Draft',
    'archived': 'Archived',
  };
  return statuses[status] || status;
}

export function getWorkflowStatusBadgeVariant(
  status: 'published' | 'draft' | 'archived'
): 'default' | 'secondary' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    'published': 'default',
    'draft': 'secondary',
    'archived': 'outline',
  };
  return variants[status] || 'secondary';
}

// ============================================================================
// Workflow Export/Import Helper Functions
// ============================================================================

export function exportWorkflowJson(workflow: any): string {
  return JSON.stringify(workflow.definition || workflow, null, 2);
}

export async function importWorkflowJson(
  jsonStr: string,
  name: string,
  description: string
): Promise<any> {
  const client = getClient();
  const workflow = JSON.parse(jsonStr);
  return client.workflows.createWorkflow({
    name,
    description,
    definition: workflow.definition || workflow,
  }) as any;
}

// ============================================================================
// Sandbox Images APIs (not in SDK yet)
// Note: SDK does not provide listSandboxImages method yet
// ============================================================================

export async function listSandboxImages(): Promise<{
  images: Array<{
    id: string;
    name: string;
    tags?: string[];
    icon?: string;
    isDefault?: boolean;
    platform?: string;
  }>;
  total: number;
  defaultImageId: string;
}> {
  const client = getClient();
  const httpClient = client.getHttpClient();
  return httpClient.get('/flexy/images') as any;
}
