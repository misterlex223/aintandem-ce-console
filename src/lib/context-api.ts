/**
 * Context API Client
 * HTTP client for context/memory management endpoints
 * Updated for new context-manager integration
 * Partially migrated to SDK where supported
 */

import type {
  Memory,
  CreateMemoryInput,
  UpdateMemoryInput,
  MemorySearchOptions,
  MemoryListFilters,
  MemoryScope,
  GetMemoriesResponse,
  SearchMemoriesResponse,
  MemoryStats,
  ContextHealthResponse,
  ImportDocumentRequest,
  ImportFolderRequest,
  ImportResult,
  SyncFileRequest,
  SyncFolderRequest,
  SyncResult,
  SyncStats,
  TrackedFile,
} from '../types/context';
import { buildApiUrl } from './config';
import { authenticatedFetch } from './api/api-helpers';
import { getClient } from './api/api-helpers';

// ============================================================================
// SDK-Supported Functions (migrated to use SDK)
// ============================================================================

/**
 * Create a new memory
 * @deprecated Use client.context.createMemory() from SDK instead
 */
export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  const client = getClient();
  // Map console types to SDK types
  const sdkRequest: any = {
    projectId: input.scope_id,
    content: input.content,
    metadata: {
      scope: input.scope,
      memory_type: input.memory_type,
      visibility: input.visibility,
      tags: input.tags,
      source: input.source,
      ...input.custom,
    },
  };
  return client.context.createMemory(sdkRequest) as Promise<Memory>;
}

/**
 * Get memory by ID
 * @deprecated Use client.context.getMemory() from SDK instead
 */
export async function getMemory(id: string): Promise<Memory> {
  const client = getClient();
  return client.context.getMemory(id) as Promise<Memory>;
}

/**
 * Update memory
 * Note: SDK uses PATCH, console previously used PUT
 * @deprecated Use client.context.updateMemory() from SDK instead
 */
export async function updateMemory(id: string, updates: UpdateMemoryInput): Promise<Memory> {
  const client = getClient();
  return client.context.updateMemory(id, updates) as Promise<Memory>;
}

/**
 * Delete memory
 * @deprecated Use client.context.deleteMemory() from SDK instead
 */
export async function deleteMemory(id: string): Promise<void> {
  const client = getClient();
  return client.context.deleteMemory(id);
}

/**
 * Search memories with semantic search
 * Note: SDK uses GET with query params, console used POST with body
 * @deprecated Use client.context.searchMemories() from SDK instead
 */
export async function searchMemories(options: MemorySearchOptions): Promise<SearchMemoriesResponse> {
  const client = getClient();
  const result = await client.context.searchMemories({
    query: options.query,
    scope: options.scope,
    scope_id: options.scope_id,
    limit: options.limit,
    include_inherited: options.include_inherited,
  }) as any;
  // Map SDK response to console response (SDK uses 'total', console uses 'count')
  return {
    results: result.memories || [],
    count: result.total || 0,
  };
}

/**
 * List memories for a project
 * Note: SDK only supports project scope, not all filters from console
 * @deprecated Use client.context.listMemories() from SDK instead
 */
export async function listMemories(filters?: MemoryListFilters): Promise<GetMemoriesResponse> {
  const client = getClient();
  // SDK requires projectId, so we need to get it from filters
  const projectId = filters?.scope_id || '';
  const result = await client.context.listMemories(projectId, {
    limit: filters?.limit,
    offset: filters?.offset,
  }) as any;
  // Map SDK response to console response (SDK returns array, console uses object with 'count')
  return {
    memories: result || [],
    count: result?.length || 0,
  };
}

/**
 * Batch create memories
 * @deprecated Use client.context.createMemoriesBatch() from SDK instead
 */
export async function batchCreateMemories(memories: CreateMemoryInput[]): Promise<any> {
  const client = getClient();
  return client.context.createMemoriesBatch(
    memories.map(m => ({
      projectId: m.scope_id,
      content: m.content,
      metadata: {
        scope: m.scope,
        memory_type: m.memory_type,
        visibility: m.visibility,
        tags: m.tags,
        source: m.source,
        ...m.custom,
      },
    }))
  );
}

/**
 * Get memory statistics for a project
 * Note: SDK only supports project scope
 * @deprecated Use client.context.getMemoryStats() from SDK instead
 */
export async function getMemoryStats(scope?: { type: MemoryScope; id: string }): Promise<MemoryStats> {
  const client = getClient();
  // SDK requires projectId
  const projectId = scope?.id || '';
  const result = await client.context.getMemoryStats(projectId) as any;
  // Map SDK response to console response (different field names)
  return {
    scope: scope?.type,
    scope_id: projectId,
    total: result.totalMemories || 0,
    by_type: {}, // SDK doesn't provide this breakdown
    context_enabled: true, // SDK doesn't provide this info
  };
}

// ============================================================================
// NOT Supported by SDK - Keep using authenticatedFetch directly
// ============================================================================

/**
 * Get memories for a specific scope with optional hierarchical inheritance
 * NOT AVAILABLE IN SDK
 */
export async function getMemoriesForScope(
  scope: MemoryScope,
  scopeId: string,
  options?: {
    memory_type?: string;
    tags?: string[];
    limit?: number;
    include_inherited?: boolean;
  }
): Promise<GetMemoriesResponse | SearchMemoriesResponse> {
  const params = new URLSearchParams();

  if (options?.memory_type) params.append('memory_type', options.memory_type);
  if (options?.tags) params.append('tags', options.tags.join(','));
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.include_inherited) params.append('include_inherited', 'true');

  const url = buildApiUrl(`/api/context/${scope}/${scopeId}/memories?${params.toString()}`);
  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get memories' }));
    throw new Error(error.error || 'Failed to get memories');
  }

  return response.json();
}

/**
 * Get similar memories
 * NOT AVAILABLE IN SDK
 */
export async function getSimilarMemories(
  memoryId: string,
  limit: number = 10
): Promise<SearchMemoriesResponse> {
  const response = await authenticatedFetch(buildApiUrl(`/api/context/memories/${memoryId}/similar?limit=${limit}`));

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get similar memories' }));
    throw new Error(error.error || 'Failed to get similar memories');
  }

  return response.json();
}

/**
 * Batch update memories
 * NOT AVAILABLE IN SDK
 */
export async function batchUpdateMemories(
  updates: Array<{ id: string; content: string }>
): Promise<any> {
  const response = await authenticatedFetch(buildApiUrl('/api/context/memories/batch'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Batch update failed' }));
    throw new Error(error.error || 'Batch update failed');
  }

  return response.json();
}

/**
 * Check context system health
 * NOT AVAILABLE IN SDK
 */
export async function getContextHealth(): Promise<ContextHealthResponse> {
  const response = await authenticatedFetch(buildApiUrl('/api/context/health'));

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Health check failed' }));
    throw new Error(error.error || 'Health check failed');
  }

  return response.json();
}

/**
 * Get context system information
 * NOT AVAILABLE IN SDK
 */
export async function getContextInfo(): Promise<{
  enabled: boolean;
  auto_capture: boolean;
  provider: string;
  version: string;
  features: Record<string, boolean>;
}> {
  const response = await authenticatedFetch(buildApiUrl('/api/context/info'));

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get info' }));
    throw new Error(error.error || 'Failed to get info');
  }

  return response.json();
}

/**
 * Get hierarchical context (with full hierarchy information)
 * NOT AVAILABLE IN SDK
 */
export async function getHierarchicalContext(
  scope: MemoryScope,
  scopeId: string
): Promise<any> {
  const url = buildApiUrl(`/api/context/hierarchical/${scope}/${scopeId}`);
  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get hierarchical context' }));
    throw new Error(error.error || 'Failed to get hierarchical context');
  }

  return response.json();
}

/**
 * Import a single document file
 * NOT AVAILABLE IN SDK
 */
export async function importDocument(request: ImportDocumentRequest): Promise<ImportResult> {
  const response = await authenticatedFetch(buildApiUrl('/api/context/import/document'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to import document' }));
    throw new Error(error.error || 'Failed to import document');
  }

  return response.json();
}

/**
 * Import all documents from a folder
 * NOT AVAILABLE IN SDK
 */
export async function importFolder(request: ImportFolderRequest): Promise<ImportResult> {
  const response = await authenticatedFetch(buildApiUrl('/api/context/import/folder'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to import folder' }));
    throw new Error(error.error || 'Failed to import folder');
  }

  return response.json();
}

/**
 * Sync a single file (re-import if changed)
 * NOT AVAILABLE IN SDK
 */
export async function syncFile(request: SyncFileRequest): Promise<SyncResult> {
  const response = await authenticatedFetch(buildApiUrl('/api/context/sync/file'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to sync file' }));
    throw new Error(error.error || 'Failed to sync file');
  }

  return response.json();
}

/**
 * Sync all files in a folder
 * NOT AVAILABLE IN SDK
 */
export async function syncFolder(request: SyncFolderRequest): Promise<SyncResult> {
  const response = await authenticatedFetch(buildApiUrl('/api/context/sync/folder'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to sync folder' }));
    throw new Error(error.error || 'Failed to sync folder');
  }

  return response.json();
}

/**
 * Get file sync statistics
 * NOT AVAILABLE IN SDK
 */
export async function getSyncStats(scope?: { type: MemoryScope; id: string }): Promise<SyncStats> {
  const params = new URLSearchParams();
  if (scope) {
    params.set('scope', scope.type);
    params.set('scope_id', scope.id);
  }

  const url = buildApiUrl(`/api/context/sync/stats?${params.toString()}`);
  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get sync stats' }));
    throw new Error(error.error || 'Failed to get sync stats');
  }

  return response.json();
}

/**
 * List all tracked files
 * NOT AVAILABLE IN SDK
 */
export async function getTrackedFiles(scope?: { type: MemoryScope; id: string }): Promise<TrackedFile[]> {
  const params = new URLSearchParams();
  if (scope) {
    params.set('scope', scope.type);
    params.set('scope_id', scope.id);
  }

  const url = buildApiUrl(`/api/context/sync/files?${params.toString()}`);
  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get tracked files' }));
    throw new Error(error.error || 'Failed to get tracked files');
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Capture task dialog to context
 * NOT AVAILABLE IN SDK
 */
export async function captureTaskDialog(
  taskId: string,
  projectId: string,
  content: string,
  metadata?: Record<string, any>
): Promise<Memory> {
  const response = await authenticatedFetch(buildApiUrl(`/api/context/capture/task/${taskId}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, content, metadata }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to capture task dialog' }));
    throw new Error(error.error || 'Failed to capture task dialog');
  }

  return response.json();
}
