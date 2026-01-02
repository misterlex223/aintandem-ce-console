/**
 * Task Context Panel
 *
 * Display context information in task detail view.
 * Shows injected context and generated dialog for completed/running tasks.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Memory, MEMORY_TYPE_INFO } from '@/types/context';
import type { TaskExecution } from '@/lib/types';
import { FileText, Loader2, Plus, Save, Eye } from 'lucide-react';
import { ContextSearchDialog } from '../context/context-search-dialog';
import { getMemoryType, getMemoryContent, getMemorySummary } from '@/lib/memory-adapters';
import { getClient } from '@/lib/api/api-helpers';

interface TaskContextPanelProps {
  task: TaskExecution;
  projectId: string;
  onLoadContext?: (memories: Memory[]) => void;
  onSaveContext?: (content: string) => void;
  className?: string;
}

interface TaskContextData {
  injectedMemories: Memory[];
  generatedMemory: Memory | null;
  activeDialog: {
    memoryId: string;
    messageCount: number;
  } | null;
  usage: {
    retrieved: number;
    injected: number;
    generated: number;
  };
}

export function TaskContextPanel({
  task,
  projectId,
  onLoadContext,
  onSaveContext,
  className = '',
}: TaskContextPanelProps) {
  const [contextData, setContextData] = useState<TaskContextData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null);

  // Fetch context data
  useEffect(() => {
    const fetchContextData = async () => {
      setLoading(true);
      try {
        const client = getClient();
        const data = await client.tasks.getTaskContext(projectId, task.id) as any;
        setContextData(data);
      } catch (error) {
        console.error('Failed to fetch task context:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContextData();
  }, [task.id, projectId]);

  // Handle save output as context
  const handleSaveOutput = async () => {
    if (!task.terminalOutput) {
      return;
    }

    if (onSaveContext) {
      onSaveContext(task.terminalOutput);
    } else {
      // Default implementation: use SDK
      try {
        const client = getClient();
        await client.tasks.saveTaskOutput(projectId, task.id, {
          content: task.terminalOutput,
          summary: `Output from task: ${task.title}`,
        } as any);
        alert('Task output saved as context!');
      } catch (error) {
        console.error('Failed to save context:', error);
        alert('Failed to save context');
      }
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!contextData) {
    return (
      <div className={`text-center text-gray-500 p-8 ${className}`}>
        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No context information available</p>
      </div>
    );
  }

  const { injectedMemories, generatedMemory, activeDialog, usage } = contextData;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Context Usage Stats */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Context Usage</h3>
          <div className="flex gap-2">
            {task.status === 'running' && activeDialog && (
              <Badge variant="outline" className="text-xs">
                Recording ({activeDialog.messageCount} messages)
              </Badge>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-500 text-xs">Injected</div>
            <div className="font-medium">{usage.injected}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Retrieved</div>
            <div className="font-medium">{usage.retrieved}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Generated</div>
            <div className="font-medium">{usage.generated}</div>
          </div>
        </div>
      </Card>

      {/* Injected Context */}
      {injectedMemories.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Injected Context ({injectedMemories.length})
          </h3>
          <div className="space-y-2">
            {injectedMemories.map(memory => {
              const memoryType = getMemoryType(memory);
              const typeInfo = MEMORY_TYPE_INFO[memoryType] || MEMORY_TYPE_INFO.knowledge;
              const isExpanded = expandedMemory === memory.id;

              return (
                <div key={memory.id} className="border rounded p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {typeInfo.icon} {typeInfo.label}
                      </Badge>
                      {memory.metadata.tags?.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedMemory(isExpanded ? null : memory.id)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-sm font-medium mb-1">
                    {getMemorySummary(memory)}
                  </div>
                  {isExpanded && (
                    <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded max-h-40 overflow-y-auto">
                      {getMemoryContent(memory)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Generated Dialog */}
      {generatedMemory && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generated Dialog
          </h3>
          <div className="border rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                💬 Dialog
              </Badge>
              {generatedMemory.metadata.tags?.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="text-sm font-medium mb-1">
              {getMemorySummary(generatedMemory)}
            </div>
            <div className="text-xs text-gray-600 line-clamp-3">
              {getMemoryContent(generatedMemory)}
            </div>
            <div className="flex items-center justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedMemory(expandedMemory === generatedMemory.id ? null : generatedMemory.id)}
              >
                <Eye className="h-3 w-3 mr-1" />
                View Full
              </Button>
            </div>
            {expandedMemory === generatedMemory.id && (
              <div className="text-xs text-gray-600 mt-3 p-3 bg-gray-50 rounded max-h-60 overflow-y-auto whitespace-pre-wrap">
                {getMemoryContent(generatedMemory)}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onLoadContext && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchDialogOpen(true)}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Load Context
          </Button>
        )}
        {task.terminalOutput && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveOutput}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Output as Context
          </Button>
        )}
      </div>

      {/* Context Search Dialog */}
      {searchDialogOpen && onLoadContext && (
        <ContextSearchDialog
          projectId={projectId}
          isOpen={searchDialogOpen}
          onClose={() => setSearchDialogOpen(false)}
          onSelectMemories={(memories) => {
            onLoadContext(memories);
            setSearchDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
