/**
 * Memory Adapters
 * Helper functions to bridge old Memory structure with new context-manager structure
 */

import type { Memory, MemoryMetadata } from '../types/context';

/**
 * Get memory content (adapts from 'memory' field to old 'content')
 */
export function getMemoryContent(memory: Memory): string {
  return memory.memory;
}

/**
 * Get memory type from metadata
 */
export function getMemoryType(memory: Memory): string {
  return memory.metadata.memory_type;
}

/**
 * Get memory scope from metadata
 */
export function getMemoryScope(memory: Memory): string {
  return memory.metadata.scope;
}

/**
 * Get memory scope ID from hierarchy context
 * Returns the most specific scope ID based on the memory's scope level
 */
export function getMemoryScopeId(memory: Memory): string {
  const { scope, hierarchy } = memory.metadata;

  switch (scope) {
  case 'organization':
    return hierarchy.org_id;
  case 'workspace':
    return hierarchy.workspace_id;
  case 'project':
    return hierarchy.project_id;
  case 'task':
    return hierarchy.task_id || hierarchy.project_id;
  default:
    return hierarchy.project_id;
  }
}

/**
 * Get memory summary (first 150 chars of content)
 * The new system doesn't have a separate summary field
 */
export function getMemorySummary(memory: Memory): string {
  const content = getMemoryContent(memory);
  if (content.length <= 150) {
    return content;
  }
  return content.slice(0, 150) + '...';
}

/**
 * Get memory tags
 */
export function getMemoryTags(memory: Memory): string[] {
  return memory.metadata.tags;
}

/**
 * Get memory visibility
 */
export function getMemoryVisibility(memory: Memory): string {
  return memory.metadata.visibility;
}

/**
 * Format memory for display (compatible with old structure)
 */
export interface DisplayMemory {
  id: string;
  content: string;
  type: string;
  scope: string;
  scopeId: string;
  summary: string;
  tags: string[];
  visibility: string;
  score?: number;
  metadata: MemoryMetadata;
  // Provenance fields (new)
  source?: {
    type: string;
    file_path?: string;
    line_start?: number;
    line_end?: number;
  };
}

/**
 * Convert Memory to DisplayMemory format
 */
export function toDisplayMemory(memory: Memory): DisplayMemory {
  return {
    id: memory.id,
    content: getMemoryContent(memory),
    type: getMemoryType(memory),
    scope: getMemoryScope(memory),
    scopeId: getMemoryScopeId(memory),
    summary: getMemorySummary(memory),
    tags: getMemoryTags(memory),
    visibility: getMemoryVisibility(memory),
    score: memory.score,
    metadata: memory.metadata,
    source: memory.metadata.source,
  };
}

/**
 * Convert array of Memory to DisplayMemory array
 */
export function toDisplayMemories(memories: Memory[]): DisplayMemory[] {
  return memories.map(toDisplayMemory);
}
